"""
Definition of views.
"""

from django.shortcuts import render
from django.shortcuts import render_to_response
from django.http import HttpRequest
from django.template import RequestContext
from django.http import JsonResponse
from django.templatetags.static import static
from django.contrib.staticfiles.storage import staticfiles_storage
from django.conf import settings

from pydap.client import open_url
from datetime import date, datetime, timedelta;
import json
import requests
import os
import posixpath

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def home(request):
    """Renders the home page."""
    assert isinstance(request, HttpRequest)
    return render(
        request,
        'index.html',
        {
            'title':'Home Page',
            'year':datetime.now().year,
        }
    )

def eriehome(request):
    """Renders the Lake Erie home page."""
    return render(
        request,
        'erie.html',
        {
            'title':'Lake Erie Home Page',
            'year':datetime.now().year,
            }
    )

def buoy(request, buoy_id):

    # Determine available buoys and check if entered ID exists. Render buoy page if does exist, render 404.html if not exist
    if not settings.DEBUG:
        metaFile = open(os.path.join(BASE_DIR,'static/Buoy_tool/data/meta_english.json'))
    else:
        metaFile = open(posixpath.join(*(BASE_DIR.split(os.path.sep) + ['Buoy_tool/static/Buoy_tool/data/meta_english.json'])))
    metaStr = metaFile.read()
    metaDic = json.loads(metaStr)
    idList = []
    for key in metaDic:
        idList.append(key['id'])
    if buoy_id in idList:
        return render(
            request,
            'buoy.html',
            {
                'buoy_id':buoy_id,
            }
        )
    else:
        print('false')
        return render(
            request,
            '404.html',
            {
            'title':'Station Not Found',
            'year':datetime.now().year,
            }
        )

def alert(request):
    """Renders the experimental alert page."""
    return render(
        request,
        'alert.html',
        {
            'title':'Alert',
            }
    )

def handler404(request):
    response = render_to_response('404.html', {},
    context_instance=RequestContext(request))
    response.status_code = 404
    return response

#------------------------------------------------------------
#-  AJAX URLs
#------------------------------------------------------------

def getBuoyData(request):

    # Pydap Docs: http://pydap.readthedocs.io/en/latest/client.html
    # Example URL: 'http://tds.glos.us/thredds/dodsC/buoys/45020/2017/45020_20170903.nc');

    # Retrieve list of buoys and parameters from request:
    lst_buoys = request.POST.getlist('buoy_arr[]')
    lst_params = request.POST.getlist('param_arr[]')

    # Start & end date/time + averaging interval:
    str_date1 = request.POST['date_start']
    str_date2 = request.POST['date_end']

    date_start = datetime.strptime(str_date1, '%m/%d/%Y')
    date_end = datetime.strptime(str_date2, '%m/%d/%Y')

    avg_ivld = request.POST['avg_ivld']
#    try:
#        avg_ivld = int(avg_ivld)       #averaging period
#    except:
#        avg_ivld = -999

    # Initialize dictionary for JSON response:
    dct_response = {}
    
    # Iterate over buoy list:
    for buoy_id in lst_buoys:

        dct_data = {}       #initialize data dictionary

        # Initialize parameters in data dictionary:
        for param_id in lst_params:
            dct_data[param_id] = {}                  #empty dict.
            dct_data[param_id]['values'] = []        #empty list
            dct_data[param_id]['units'] = ''
            dct_data[param_id]['desc'] = ''

        #data_all = [];
        lst_times = [];
        initFlag = True

        #--- Start date loop ------------------------------------------
        for dateVal in dateRange(date_start, date_end):

            # Construct URL for OpenDAP access of date-specific netCDF file:
            url_nc = 'http://tds.glos.us/thredds/dodsC/buoys_standard/{0}/{1}/{0}_{2}.nc'.format(buoy_id, dateVal.strftime("%Y"), dateVal.strftime("%Y%m%d"));
        
            try:
                ds = open_url(url_nc);
                lstKeys = list(ds.keys());

                # Extend "times" list:
                #times = ds['time'];
                lst_times.extend(ds['time']);

                if initFlag :
                    lst = ds['time'].units.split('since')
                    tunit = lst[0].strip()
                    tzero = datetime.strptime(lst[1].strip(), '%Y-%m-%d %H:%M:%S')


                # Download data for each parameter:
                for param_id in lst_params:
                    if param_id in lstKeys:
                        var = ds[param_id]
                        dct_data[param_id]['values'].extend(var.data[:])

                        if (initFlag == True):
                            dct_data[param_id]['units'] = var.attributes['units']
                            dct_data[param_id]['desc'] = var.attributes['description']

                initFlag = False

            except:
               test = 0
               # Add error handling
        #--- End date loop ------------------------------------------

        ichk = 0;

        # Conduct time averaging (*code to be developed*):
        if (int(avg_ivld) > 0):
            ichk = 0

        # Convert list of times to date:
        lst_dattim = []
 
        for t in lst_times:
            lst_dattim.append(tzero + timedelta(seconds=t))
          
    #--------------------------------------------------------

    # Augment dictionary for JSON response & return response:
    dct_response[buoy_id] = {}
    dct_response[buoy_id]['dattim'] = lst_dattim
    dct_response[buoy_id]['params'] = dct_data

    return JsonResponse(dct_response, safe=False)


# Function to provide iteration over date range between two dates:
def dateRange(start_date, end_date):
    for n in range(int((end_date - start_date).days)):
        yield start_date + timedelta(n)

