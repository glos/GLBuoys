"""
Definition of views.
"""

from django.shortcuts import render
from django.http import HttpRequest
from django.template import RequestContext
from django.http import JsonResponse

from pydap.client import open_url
from datetime import date, datetime, timedelta;
import json
import requests
import urllib.request
import urllib3
import os

def plotter(request):
    # Renders plotting tool page

    return render(
        request,
        'app/plotter.html', {'req_data': {}}
    )


def plotter_get(request):
    # Renders plotting tool page

    return render(
        request,
        'app/plotter.html', {'req_data': json.dumps(request.GET.dict()) }
    )


#==================================================================================
#-  AJAX URLs
#==================================================================================

def getTSData(request):

    flag = 'fast'

    if (flag == 'fast'):
        dct_response = getTSData_fast(request)
    else:
        dct_response = getTSData_slow(request)


    return JsonResponse(dct_response, safe=False)

#------------------------------------------------------------
#-  Retrieve time series data via OPeNDAP request for aggregated data:
#------------------------------------------------------------
def getTSData_fast(request):

    # Pydap Docs: http://pydap.readthedocs.io/en/latest/client.html

    # Initialize dictionary for JSON response:
    dct_response = {}
    ncFlag = True          #Flag indicating that data was read from netCDF file

    #--------------------------------------------------------
    # Retrieve input data from POST request:
    #--------------------------------------------------------
    dct_request = request.POST.dict()

    data_type = dct_request['data_type'] #request.POST['data_type']

    lst_locs = request.POST.getlist('loc_arr[]')
    dct_owners = json.loads(dct_request['owners'])

    lst_params = request.POST.getlist('param_arr[]')

    # Start & end date/time:
    str_date1 = dct_request['date_start']
    str_date2 = dct_request['date_end']

    date_start = datetime.strptime(str_date1, '%m/%d/%Y')
    date_end = datetime.strptime(str_date2, '%m/%d/%Y')

    # Time averaging interval:
    avg_ivld = dct_request['avg_ivld']
    
    #--------------------------------------------------------
    # Iterate over locations list:
    #--------------------------------------------------------
    for loc_id in lst_locs:

        dct_data = {}       #initialize data dictionary

        lst_timerng = getTimeIndices(loc_id, date_start, date_end) 
        tidx1 = lst_timerng[0]; tidx2 = lst_timerng[1]

        # Initialize parameters in data dictionary:
        for param_id in lst_params:
            dct_data[param_id] = {}                  #empty dict.
            dct_data[param_id]['values'] = []        #empty list
            dct_data[param_id]['units'] = ''
            dct_data[param_id]['desc'] = ''

        lst_times = []
        lst_dattim  = []
        initFlag = True

        #-------------------------------------------------------
        #- "Buoy" monitoring type:
        #-------------------------------------------------------
        if (data_type == 'buoy'):

            # Construct URL for OpenDAP access of date-specific netCDF file (** currently hardcoded for buoys**):
            url_nc = 'http://tds.glos.us/thredds/dodsC/buoy_agg/{0}/{0}.ncml'.format(loc_id)
        
            try:
                ds = open_url(url_nc);
                lstKeys = list(ds.keys());

                # Extend "times" list:
                #times = ds['time'];
                lst_times.extend(ds['time'][tidx1:tidx2]);

                # Determine time zero:
                if initFlag :
                    lst = ds['time'].units.split('since')
                    tunit = lst[0].strip()
                    tzero = datetime.strptime(lst[1].strip(), '%Y-%m-%d %H:%M:%S')

                # Download data for each parameter:
                for param_id in lst_params:
                    if param_id in lstKeys:
                        var = ds[param_id]
                        dct_data[param_id]['values'].extend(var.data[tidx1:tidx2])

                        if (initFlag == True):
                            dct_data[param_id]['units'] = var.attributes['units']
                            dct_data[param_id]['desc'] = var.attributes['description']

                # Reset initialization flag:
                initFlag = False

            except:

                if (dct_owners[loc_id] == 'NOAA-NDBC'):
                    ncFlag = False

                    break       #TMR!!! - break and return no data

                    # TMR!!! - example retrieval for data from past years provided below
                    txtResp = urllib.request.urlopen('http://www.ndbc.noaa.gov/view_text_file.php?filename={0}h2016.txt.gz&dir=data/historical/stdmet/'.format(loc_id))
                    lines = txtResp.readlines()

                    ln_ct = 0
                    lst_pidx = []

                    for l in lines:
                        ln_ct += 1
                        if (ln_ct > 5002): break

                        lst_vals = l.decode('UTF-8').strip().split()

                        if (ln_ct == 1): 
                            lst_fields = lst_vals
                            for param_id in lst_params:
                                i_par = lst_fields.index(param_id)                            
                                lst_pidx.append(i_par)

                        elif (ln_ct == 2):
                            lst_units = lst_vals
                        else:
                            #Get date/time:
                            iyr = int(lst_vals[0]); imon = int(lst_vals[1]); iday = int(lst_vals[2])
                            ihr = int(lst_vals[3]); imin = int(lst_vals[4])
                            dt = datetime(iyr,imon,iday,ihr,imin)
                            lst_dattim.append(dt)

                            #Get parameter values:
                            ipar = 0
                            for param_id in lst_params:
                                
                                dct_data[param_id]['values'].append(float(lst_vals[lst_pidx[ipar]]))
                                dct_data[param_id]['units'] = lst_units[lst_pidx[ipar]]
                                dct_data[param_id]['desc'] = param_id           #TMR!!!

                                ipar += 1
                    pass

                # TMR - need error handling here?
                pass

        #-----------------------------------
        # Conduct time averaging (*TMR!!! - code to be developed*):
        #-----------------------------------
        #if (int(avg_ivld) > 0):
        #    ichk = 0

        #-----------------------------------
        # Convert list of times to date:
        #-----------------------------------
        if (len(lst_times) > 0 and len(lst_dattim) == 0): 
            for t in lst_times:
                lst_dattim.append(tzero + timedelta(seconds=t))
        #-----------------------------------
          
        # Augment dictionary for JSON response:
        dct_response[loc_id] = {}
        dct_response[loc_id]['dattim'] = lst_dattim
        dct_response[loc_id]['params'] = dct_data

    #--------------------------------------------------------
    #- End location loop
    #--------------------------------------------------------

    # Return response:
    return dct_response
    #return JsonResponse(dct_response, safe=False)


#------------------------------------------------------------
#-  Retrieve time series data via daily netCDF files:
#------------------------------------------------------------

def getTSData_slow(request):

    # Pydap Docs: http://pydap.readthedocs.io/en/latest/client.html
    # Example URL: 'http://tds.glos.us/thredds/dodsC/buoys/45020/2017/45020_20170903.nc');

    # Retrieve list of locations and parameters from request:
    lst_locs = request.POST.getlist('loc_arr[]')
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
    
    # Iterate over locations list:
    for loc_id in lst_locs:

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
            url_nc = 'http://tds.glos.us/thredds/dodsC/buoys/{0}/{1}/{0}_{2}.nc'.format(loc_id, dateVal.strftime("%Y"), dateVal.strftime("%Y%m%d"));
        
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

        # Augment dictionary for JSON response:
        dct_response[loc_id] = {}
        dct_response[loc_id]['dattim'] = lst_dattim
        dct_response[loc_id]['params'] = dct_data

    #x = getTSIntervals('45025')

    # Return response:
    return dct_response
    #return JsonResponse(dct_response, safe=False)



# Function to provide iteration over date range between two dates:
def dateRange(start_date, end_date):
    for n in range(int((end_date - start_date).days)):
        yield start_date + timedelta(n)
        


# Function to return a list with indices referencing the start date and end date:
def getTimeIndices(loc_id, date_start, date_end):

    url_nc = 'http://tds.glos.us/thredds/dodsC/buoy_agg/{0}/{0}.ncml'.format(loc_id)

    try:
        ds = open_url(url_nc);

        # "times" list:
        lst_times = []      #empty list
        lst_times.extend(ds['time']);

        lst = ds['time'].units.split('since')
        tunit = lst[0].strip()
        tzero = datetime.strptime(lst[1].strip(), '%Y-%m-%d %H:%M:%S')

        # Convert start & end dates to seconds:
        lst_dsec = []
        lst_rdates = [date_start, date_end]

        dt_today = datetime.today()

        for dt in lst_rdates:
            lst_dsec.append(int((dt - tzero).total_seconds()))

        lst_idx = []
        lst_sign = [1, -1]

        i = -1
        for idsec in lst_dsec:
            i += 1
            date_chk = lst_rdates[i]

            if (date_chk > dt_today):
                try:
                    idx = lst_times.index(idsec)
                    idx = (len(lst_times) - 1)
                    lst_idx.append(idx)
                    continue
                except:
                    pass

            try:
                idx = lst_times.index(idsec)
            except:
                idx = -9999

                for dday in range(1, 365):           #Check for start date
                    date_tmp = date_chk + timedelta(lst_sign[i] * dday)    #check forward or backward, 1 day at a time
                    if (i == 0 and date_tmp >= date_end): break
                    if (i == 1 and date_tmp <= date_start): break

                    try:
                        dsec = int((date_tmp - tzero).total_seconds())        # Number of seconds elapsed
                        idx = lst_times.index(dsec)
                        break
                    except:
                        idx = -9999

            lst_idx.append(idx)


        return lst_idx

    except Exception as inst:
        print(inst)
        return [-9999, -9999]


def getTSInterval(loc_id):

    # Check for existing "[loc_id]_intervals.json":
    strFile = './json/' + loc_id + '_intervals.json'

    if (os.path.isfile(strFile)):
        pFile = open(strFile)
        json_data = pFile.read()
        pFile.close()

        dctData = json.loads(json_data)

    else:
        # Read the aggregate dataset and parse
        i = 0

        url_nc = 'http://tds.glos.us/thredds/dodsC/buoy_agg/{0}/{0}.ncml'.format(loc_id)

        try:
            ds = open_url(url_nc);

            # "times" list:
            lst_times = ds['time'];

            lst = ds['time'].units.split('since')
            tunit = lst[0].strip()
            tzero = datetime.strptime(lst[1].strip(), '%Y-%m-%d %H:%M:%S')

            # Convert list of times to date:
            lst_dattim = []            

            dctData = {}
            for iyr in range(2001, datetime.today().year):
                dctData[iyr] = {}

            for t in lst_times:
                dattim = tzero + timedelta(seconds=t)
                                              
                #lst_dattim.append(dattim)

        except:
            pass

    return dctData

    # Check 

