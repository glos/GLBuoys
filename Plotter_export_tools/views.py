"""
Definition of views.
"""

from django.shortcuts import render
from django.http import HttpRequest
from django.http import HttpResponse
from django.template import RequestContext
from django.http import JsonResponse
from django.utils.encoding import smart_str

from pydap.client import open_url
from datetime import date, datetime, timedelta;
import json
import requests
import urllib.request
import urllib3
import xlwt
import os
import csv

def plotter(request):
    # Renders plotting tool page
    pageInfo = {'title': 'GLOS Data Plotting Tool'}

    return render(
        request,
        'plotter.html', pageInfo #{'req_data': {}}
    )


def plotter_get(request):
    # Renders plotting tool page

    return render(
        request,
        'plotter.html', 
        {'req_data': json.dumps(request.GET.dict()), 'title': 'GLOS Data Plotting Tool' }
    )

def export(request):
    # Renders data export page
    pageInfo = {'title': 'GLOS Data Exporting Tool'}
    return render(
        request,
        'export.html', pageInfo
    )

# avg_ivld - user selected average interval: 
def process_interval_avg(dct_response, avg_ivld):
    dct_response_avg ={}

    interval_in_mins= get_interval_in_mins(avg_ivld)

    if interval_in_mins ==0:
        return dct_response

    import pandas as pd

    for loc in dct_response.keys():
        
        numRec = len(dct_response[loc]['dattim'])
        # start a new dataframe
        df= pd.DataFrame()

        df['dattim'] = pd.to_datetime(dct_response[loc]['dattim'])
        for param in dct_response[loc]['params'].keys():
            # add columns to dataframe
            df[param] =dct_response[loc]['params'][param]['values']

        df.set_index(pd.DatetimeIndex(dct_response[loc]['dattim']), inplace=True)

        # resample with new average interval
        df_avg=df.resample(str(interval_in_mins) + 'min').mean()

        dct_loc={}
        lst_time =[]
        for t in df_avg.index:
            lst_time.append(t.to_pydatetime())

        dct_loc['dattim']= lst_time
        
        dct_data={}
        for param in dct_response[loc]['params'].keys():
            dct_data[param] = {}  

            dct_data[param]['units'] = dct_response[loc]['params'][param]['units']
            dct_data[param]['desc'] = param
            lst_val=[]
            for val in df_avg[param]:
                lst_val.append(val.item())
            
            dct_data[param]['values']=lst_val

        dct_loc['params']= dct_data

        # add to the to-be-returned dictionary
        dct_response_avg[loc]= dct_loc
        
    return dct_response_avg


# download data to 'csv' or 'xls' format
def download_data(request):

    filename = 'glos_data_export'
    file_type = request.GET.get('ftype','')  # csv / xls
    unit_type = request.GET.get('utype','')  # metric / english
    
    # get the parameters
    data_type, lst_locs, lst_params, str_date1, str_date2, dct_owners, avg_ivld = queryRequestVars(request, 'GET')

    flag = 'fast'

    if (flag == 'fast'):
        dct_response = getTSData_fast(request, 'GET')
        
        # process interval average
        dct_response= process_interval_avg(dct_response, avg_ivld)

        # convert to English units
        if (unit_type=='eng'):
            for loc in lst_locs:
                for param in lst_params:
                    newvals, newunit = metricToEnglish(dct_response[loc]['params'][param]['values'],
                                        dct_response[loc]['params'][param]['units'])
                    dct_response[loc]['params'][param]['values'] = newvals
                    dct_response[loc]['params'][param]['units'] = newunit

        # source: http://thepythondjango.com/download-data-csv-excel-file-in-django/
        if file_type=='csv':
            # call csv generator
                
            # response content type
            response = HttpResponse(content_type='text/csv')
            #decide the file name
            response['Content-Disposition'] = 'attachment; filename="' + filename + "." + file_type + '"'
            writer = csv.writer(response)
            #response.write(u'\ufeff'.encode('utf8'))

            for loc in lst_locs:
                writer.writerow([smart_str(loc)])
                numRec = len(dct_response[loc]['dattim'])

                if len(lst_params) >0:
                    headColums=['Datetime']

                    for param in lst_params:
                        param_w_units= param + "(" + dct_response[loc]['params'][param]['units'] + ")"
                        headColums.append(param_w_units)
                    
                    writer.writerow(headColums)

                    for i in range(numRec):
                        dattim = dct_response[loc]['dattim'][i]
                        date_formated = dattim.strftime('%Y-%m-%d %H:%M:%S')
                        dataColums=[date_formated]

                        for param in lst_params:
                            dataColums.append(dct_response[loc]['params'][param]['values'][i])

                        writer.writerow(dataColums)
            
            return response
        
        elif file_type=='xls':

            # call excel generator
            # content-type of response
            response = HttpResponse(content_type = 'application/ms-excel')

            #decide file name
            response['Content-Disposition']='attachment; filename="' + filename + "." + file_type + '"'

            #creating workbook
            wb = xlwt.Workbook(encoding='utf-8')

            for loc in lst_locs:

                #adding sheet
                ws=wb.add_sheet(loc)

                #sheet header, first row
                row_num=0
                col_num=0

                font_style = xlwt.XFStyle()
                boldfont_style = xlwt.XFStyle()
                # headers are bold
                boldfont_style.font.bold = True

                if len(lst_params) >0:
                    # date time column
                    ws.write(row_num, col_num, 'Datetime', boldfont_style)
                    for dattim in dct_response[loc]['dattim']:
                        row_num +=1
                        date_formated = dattim.strftime('%Y-%m-%d %H:%M:%S')
                        ws.write(row_num, col_num, date_formated, font_style)

                    # each parameter
                    for param in lst_params:
                        col_num +=1
                        row_num =0
                        param_w_units= param + "(" + dct_response[loc]['params'][param]['units'] + ")"

                        ws.write(row_num, col_num, param_w_units, boldfont_style)
                        for val in dct_response[loc]['params'][param]['values']:
                            row_num +=1
                            ws.write(row_num, col_num, val, font_style)


            wb.save(response)

            return response

        else:
            return


    else: # todo: support slow method
        return


download_data.short_description =u"Export data"


#==================================================================================
#-  AJAX URLs
#==================================================================================

def getTSData(request):

    flag = 'fast'

    if (flag == 'fast'):
        dct_response = getTSData_fast(request, 'POST')
    else:
        dct_response = getTSData_slow(request)


    return JsonResponse(dct_response, safe=False)

#------------------------------------------------------------
#-  Retrieve time series data via OPeNDAP request for aggregated data:
#------------------------------------------------------------
def getTSData_fast(request, type):

    # Pydap Docs: http://pydap.readthedocs.io/en/latest/client.html

    # Initialize dictionary for JSON response:
    dct_response = {}
    lst_locs= []
    lst_params = []
    dct_owners= []
    ncFlag = True          #Flag indicating that data was read from netCDF file

    data_type, lst_locs, lst_params, str_date1, str_date2, dct_owners, avg_ivld = queryRequestVars(request, type)

    date_start = datetime.strptime(str_date1, '%m/%d/%Y')
    date_end = datetime.strptime(str_date2, '%m/%d/%Y')

    
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

    # process interval average
    dct_response= process_interval_avg(dct_response, avg_ivld)
    
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


def queryRequestVars(request, type):

    data_type=''
    lst_locs= []
    lst_params = []
    dct_owners= []
    str_date1=''
    str_date2=''
    avg_ivld = ''

    if type=='POST':
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

        # Time averaging interval:
        avg_ivld = dct_request['avg_ivld']

	
    elif type=='GET':
	    #--------------------------------------------------------
        # Retrieve input data from GET request for file download:
        #--------------------------------------------------------

        data_type = request.GET.get('data_type', '')

        loc = request.GET.get('loc', '')
        lst_locs.append(loc)

        params= request.GET.get('param_arr', '')
        lst_params = params.split('|')
		
        str_date1 = request.GET.get('date_start','')
        str_date2 = request.GET.get('date_end','')

        dct_owner = request.GET.get('owner','')
        dct_owners.append(dct_owner)

        avg_ivld= request.GET.get('avg_ivld','none')

		
    return data_type, lst_locs, lst_params, str_date1, str_date2, dct_owners, avg_ivld


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

# metric units to english conversion
# values - list of value
def metricToEnglish(values, met_unit):
    
    cnvFactor = 1
    intcpt =0
    new_unit =met_unit

    if (met_unit == 'celsius'):
        cnvFactor = (9.0 / 5)
        intcpt = 32.0
        new_unit = 'fahrenheit'
    elif (met_unit == 'm'):
        cnvFactor = 3.28084
        new_unit = 'ft'
    elif (met_unit == 'm_s-1'):
        cnvFactor = 1.94384
        new_unit = 'kts'

    newValues = [val * cnvFactor + intcpt for val in values]

    return [newValues, new_unit]

# turn user interval string into # of minutes
def get_interval_in_mins(avg_ivld):
       switcher = {
           "none": 0,
           "30_min": 30,
           "1_hr": 60,
           "2_hr": 120,
           "4_hr": 240, 
           "6_hr": 360, 
           "8_hr": 480,
           "12_hr": 720,
           "1_day": 1440,
       }

       return switcher.get(avg_ivld, 0)

    # Check 

