"""
Definition of views.
"""

from django.http import Http404
from django.shortcuts import render
from django.http import HttpRequest
from django.http import HttpResponse
from django.template import RequestContext
from django.http import JsonResponse
from django.utils.encoding import smart_str

from pydap.client import open_url
from datetime import date, datetime, timedelta;

import numpy as np
import json
import requests
import urllib.request
import urllib3
import xlwt
import os
import io
import csv
import xlsxwriter

def plotter(request):
    # Renders plotting tool page
    pageInfo = {'req_data': json.dumps(request.GET.dict()), 'title': 'Data Plotting Tool (beta)'}

    return render(
        request,
        'plotter.html', pageInfo
    )


def plotter_get(request):
    # Renders plotting tool page

    return render(
        request,
        'plotter.html', 
        {'req_data': json.dumps(request.GET.dict()), 'title': 'Data Plotting Tool (beta)' }
    )

def export(request):
    # Renders data export page
    pageInfo = {'req_data': json.dumps(request.GET.dict()), 'title': 'Data Export Tool (beta)'}

    return render(
        request,
        'export.html', pageInfo
    )

def export_get(request):
    # Renders plotting tool page

    return render(
        request,
        'export.html', 
        {'req_data': json.dumps(request.GET.dict()), 'title': 'Data Export Tool (beta)' }
    )


# avg_ivld - user selected average interval: 
def process_interval_avg(dct_response, avg_ivld):
    
    dct_response_avg ={}
    dct_response_avg['locations'] = {}
    dct_response_avg['err_flag'] = False
    dct_response_avg['status'] = 'normal'
    dct_response_avg['message'] = ''

    interval_in_mins= get_interval_in_mins(avg_ivld)

    if interval_in_mins ==0:
        return dct_response

    import pandas as pd

    for loc in dct_response['locations'].keys():

        dctLoc_raw = dct_response['locations'][loc] 
        numRec = len(dctLoc_raw['dattim'])

        if (numRec > 0):

            # start a new dataframe
            df= pd.DataFrame()

            df['dattim'] = pd.to_datetime(dctLoc_raw['dattim'])
            for param in dctLoc_raw['params'].keys():
                # add columns to dataframe
                df[param] = dctLoc_raw['params'][param]['values']

            df.set_index(pd.DatetimeIndex(dctLoc_raw['dattim']), inplace=True)

            # resample with new average interval
            df_avg=df.resample(str(interval_in_mins) + 'min').mean()

            dctLoc_avg = {}
            lst_time = [t.to_pydatetime() for t in df_avg.index]
            dctLoc_avg['dattim'] = lst_time
        
            dct_data={}
            for param in dctLoc_raw['params'].keys():
                dct_data[param] = {}  

                dct_data[param]['units'] = dctLoc_raw['params'][param]['units']
                dct_data[param]['desc'] = param

                try:
                    lst_val=[val for val in df_avg[param]]
                except Exception as e:
                    dct_response_avg['err_flag'] = True
                    dct_response_avg['status'] = 'normal'
                    dct_response_avg['message'] = 'Temporal averaging failed, so raw data are being displayed instead.'
                    break

                # Eradicate NULLs:
                lst_fval = []
                for val in lst_val:
                    if (np.isnan(val)):
                        lst_fval.append('null')
                    else:
                        lst_fval.append(val)

                dct_data[param]['values'] = lst_fval    #lst_val

            dctLoc_avg['params'] = dct_data

            # add to the to-be-returned dictionary (report raw values if error has occurred):
            if (dct_response_avg['err_flag']):
                dct_response_avg['locations'][loc] = dctLoc_raw
            else:
                dct_response_avg['locations'][loc] = dctLoc_avg
            
        else:
            dct_response_avg['locations'][loc] = dctLoc_raw

    return dct_response_avg


# download data to 'csv' or 'xls' format
# now support 'xlsx' format
def download_data(request):

    file_type = request.GET.get('ftype','')  # csv / xls
    unit_type = request.GET.get('units','')  # metric / english
    
    # get the parameters
    data_type, lst_locs, lst_params, str_date1, str_date2, dct_owners, avg_ivld = queryRequestVars(request, 'GET')

    # Define file name:
    strLocs = ''
    for loc in lst_locs:
        if (strLocs != ''):
            strLocs += '-'
        strLocs += loc
    strDateNow = datetime.now().strftime("%Y-%M-%D")

    filename = 'GLOS_data_export_' + strLocs #+ '_' + strDateNow

    # Processing:
    flag = 'fast'

    if (flag == 'fast'):
        dct_response = getTSData_fast(request, 'GET')

        if dct_response['err_flag']:

            #return HttpResponseNotFound('<h1>' + dct_response['message'] + '</h1>')
            #raise Http404(dct_response['message'])
            html = "<html><body>Error message: %s</body></html>" % dct_response['message']
            return HttpResponse(html)
        
        # process interval average (this is already handled in "getTSData_fast" function):
        #dct_response= process_interval_avg(dct_response, avg_ivld)

        # convert to English units
        if (unit_type=='eng'):
            for loc in lst_locs:
                dctLoc = dct_response['locations'][loc]

                for param in lst_params:
                    newvals, newunit = metricToEnglish(dctLoc['params'][param]['values'],
                                        dctLoc['params'][param]['units'])
                    dctLoc['params'][param]['values'] = newvals
                    dctLoc['params'][param]['units'] = newunit

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
                dctLoc = dct_response['locations'][loc]

                writer.writerow([smart_str(loc)])
                numRec = len(dctLoc['dattim'])

                if (len(lst_params) > 0 and numRec > 0):
                    headColumns=['Date/Time (UTC)']

                    for param in lst_params:
                        param_w_units= param + " (" + dctLoc['params'][param]['units'] + ")"
                        headColumns.append(param_w_units)
                    
                    writer.writerow(headColumns)

                    for i in range(numRec):
                        dattim = dctLoc['dattim'][i]
                        date_formated = dattim.strftime('%m/%d/%Y %H:%M:%S')
                        dataColumns=[date_formated]

                        for param in lst_params:
                            dataColumns.append(dctLoc['params'][param]['values'][i])

                        writer.writerow(dataColumns)
                else:
                    writer.writerow('No data available for this station for the selected period')

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
                dctLoc = dct_response['locations'][loc]
                numRec = len(dctLoc['dattim'])

                #adding sheet
                ws=wb.add_sheet(loc)

                #sheet header, first row
                row_num=0
                col_num=0

                # Create bold font type:
                font_style = xlwt.XFStyle()
                boldfont_style = xlwt.XFStyle()
                boldfont_style.font.bold = True

                # Write header rows:
                ws.write(0, 0, "Station ID:", boldfont_style)
                ws.write(0, 1, loc, font_style)

                ws.write(1, 0, "Station Description:", boldfont_style)
                ws.write(1, 1, loc, font_style)

                # Write data:
                row_num = 5

                if (len(lst_params) > 0 and numRec > 0):
                    # date time column
                    ws.write(row_num, col_num, 'Date/Time (UTC)', boldfont_style)
                    for dattim in dctLoc['dattim']:
                        row_num +=1
                        date_formated = dattim.strftime('%m/%d/%Y %H:%M:%S')
                        ws.write(row_num, col_num, date_formated, font_style)

                    # each parameter
                    for param in lst_params:
                        col_num += 1
                        row_num = 5
                        param_w_units= param + " (" + dctLoc['params'][param]['units'] + ")"

                        ws.write(row_num, col_num, param_w_units, boldfont_style)
                        for val in dctLoc['params'][param]['values']:
                            row_num +=1
                            ws.write(row_num, col_num, val, font_style)
                else:
                    ws.write(5,0, 'No data available for the selected time period.', font_style)

            wb.save(response)

            return response

        elif file_type=='xlsx':
            # source:https://xlsxwriter.readthedocs.io/example_django_simple.html
            # Create an in-memory output file for the new workbook.
            output = io.BytesIO()

            # Even though the final file will be in memory the module uses temp
            # files during assembly for efficiency. To avoid this on servers that
            # don't allow temp files, for example the Google APP Engine, set the
            # 'in_memory' Workbook() constructor option as shown in the docs.
            wb = xlsxwriter.Workbook(output)

            for loc in lst_locs:
                dctLoc = dct_response['locations'][loc]
                numRec = len(dctLoc['dattim'])

                #adding sheet
                ws=wb.add_worksheet(loc)

                #sheet header, first row
                row_num=0
                col_num=0

                # Create bold font type:
                font_style = wb.add_format()
                boldfont_style =  wb.add_format({'bold': True})

                # Write header rows:
                ws.write(0, 0, "Station ID:", boldfont_style)
                ws.write(0, 1, loc, font_style)

                ws.write(1, 0, "Station Description:", boldfont_style)
                ws.write(1, 1, loc, font_style)

                # Write data:
                row_num = 5

                if (len(lst_params) > 0 and numRec > 0):
                    # date time column
                    ws.write(row_num, col_num, 'Date/Time (UTC)', boldfont_style)
                    for dattim in dctLoc['dattim']:
                        row_num +=1
                        date_formated = dattim.strftime('%m/%d/%Y %H:%M:%S')
                        ws.write(row_num, col_num, date_formated, font_style)

                    # each parameter
                    for param in lst_params:
                        col_num += 1
                        row_num = 5
                        param_w_units= param + " (" + dctLoc['params'][param]['units'] + ")"

                        ws.write(row_num, col_num, param_w_units, boldfont_style)
                        for val in dctLoc['params'][param]['values']:
                            row_num +=1
                            ws.write(row_num, col_num, val, font_style)
                else:
                    ws.write(5,0, 'No data available for the selected time period.', font_style)
            
            # Close the workbook before sending the data.
            wb.close()
            
            # Rewind the buffer.
            output.seek(0)

            # content-type of response
            response = HttpResponse(output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

            response['Content-Disposition']='attachment; filename="' + filename + "." + file_type + '"'
                        #creating workbook

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
    dct_response['locations'] = {}
    dct_response['err_flag'] = False
    dct_response['status'] = 'normal'
    dct_response['message'] = ''

    lst_locs= []
    lst_params = []
    dct_owners= []
    ncFlag = True          #Flag indicating that data was read from netCDF file

    [data_type, lst_locs, lst_params, str_date1, str_date2, dct_owners, avg_ivld] = queryRequestVars(request, type)

    try:
        date_start = datetime.strptime(str_date1, '%Y-%m-%d')
    except Exception:
        dct_response['err_flag'] = True
        dct_response['message'] = 'Invalid start date!'
        return dct_response

    try:
        date_end = datetime.strptime(str_date2, '%Y-%m-%d')
    except Exception:
        dct_response['err_flag'] = True
        dct_response['message'] = 'Invalid end date!'
        return dct_response

    if date_end <= date_start:
        dct_response['err_flag'] = True
        dct_response['message'] = 'End date should be greater than start date!'
        return dct_response
    #--------------------------------------------------------
    # Iterate over locations list:
    #--------------------------------------------------------
    for loc_id in lst_locs:

        dct_data = {}       #initialize data dictionary
        
        #Check if this is an aliased ID; if so, set the base ID:
        loc_alias = loc_id
        if (loc_id == '45165' or loc_id == '45029'):
            loc_alias = loc_id + '_1'

        # Initialize response dictionary:
        dct_response['locations'][loc_id] = {}
        dct_response['locations'][loc_id]['dattim'] = []
        dct_response['locations'][loc_id]['params'] = []

        # Get time index:
        lst_timerng = getTimeIndices(loc_id, loc_alias, date_start, date_end) 

        if isinstance(lst_timerng, dict):
            dct_response['err_flag'] = True
            dct_response['message'] = lst_timerng['message']
            return dct_response

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

        if (tidx1 >= 0 and tidx2 >= 0):

            #-------------------------------------------------------
            #- "Buoy" monitoring type:
            #-------------------------------------------------------
            if (data_type == 'buoy'):

                # Construct URL for OpenDAP access of date-specific netCDF file (** currently hardcoded for buoys**):
                url_nc = 'http://tds.glos.us/thredds/dodsC/buoy_agg_standard/{0}/{1}.ncml'.format(loc_alias, loc_id)
        
                try:
                    try:
                        ds = open_url(url_nc);
                    except Exception as e:
                        # Error reporting:
                        dct_response['err_flag'] = True
                        dct_response['status'] = 'abort'
                        strMsg = 'The requested data cannot be retrieved from the server at this time. '

                        if (dct_owners[loc_id] == 'NOAA-NDBC'):
                            strMsg += 'Please note that this viewer does not support NOAA NDBC buoys that are not directly supported in the GLOS DMAC.'
                        
                        dct_response['message'] = strMsg
                        return dct_response                    
                    
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
            #dct_response[loc_id] = {}
            dct_response['locations'][loc_id]['dattim'] = lst_dattim
            dct_response['locations'][loc_id]['params'] = dct_data
        else:
            dct_response['err_flag'] = True
            dct_response['message'] = 'No data for the requested selected period!'
            return dct_response
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

    date_start = datetime.strptime(str_date1, '%Y-%m-%d')
    date_end = datetime.strptime(str_date2, '%Y-%m-%d')

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

    data_type='buoy'
    lst_locs= []
    lst_params = []
    dct_owners= {}
    str_date1=''
    str_date2=''
    avg_ivld = 'none'
    tperiod = 'custom'

	#--------------------------------------------------------
    # Retrieve input data from GET or POST request (as dictionary):
    #--------------------------------------------------------
    if type=='POST':
        dct_request = request.POST.dict()
    elif type=='GET':
        dct_request = request.GET.dict()

    if ('data_type' in dct_request):
        data_type = dct_request['data_type']

    locs = dct_request['locs']
    #locs = request.POST.get('locs', '')
    lst_locs = locs.split('|')

    #Short-term fix to populate asset owners:
    for loc_id in lst_locs:
        if (loc_id in dct_owners):
            pass
        else:
            dct_owners[loc_id] = loc_id

    #lst_locs = request.POST.getlist('locs[]')
    #dct_owners = json.loads(dct_request['owners'])

    #params = request.POST.get('params', '')
    params = dct_request['params']
    lst_params = params.split('|')

    #lst_params = request.POST.getlist('params[]')

    # Start & end date/time:
    if ('date_start' in dct_request):
        str_date1 = dct_request['date_start']
    if ('date_end' in dct_request):
        str_date2 = dct_request['date_end']

    # Time averaging interval:
    avg_ivld = 'none'

    if ('avg_ivld' in dct_request):    
        avg_ivld = dct_request['avg_ivld']

    # Time period:
    tperiod = 'custom'

    if ('tperiod' in dct_request):
        tperiod = dct_request['tperiod']

    # Modify dates if needed:
    if (tperiod != 'custom'):
        lst = tperiod.split('_')
        tp_os = int(lst[0])
        tp_unit = lst[1].lower()[0];

        if (tp_unit == 'd'):
            dt_end = datetime.now().date() + timedelta(days=1)            
            dt_start = dt_end - timedelta(days=tp_os)

            str_date1 = datetime.strftime(dt_start, '%Y-%m-%d')
            str_date2 = datetime.strftime(dt_end, '%Y-%m-%d')

    # Return values:
    return data_type, lst_locs, lst_params, str_date1, str_date2, dct_owners, avg_ivld


# Function to provide iteration over date range between two dates:
def dateRange(start_date, end_date):
    for n in range(int((end_date - start_date).days)):
        yield start_date + timedelta(n)
        


# Function to return a list with indices referencing the start date and end date:
def getTimeIndices(loc_id, loc_alias, date_start, date_end):

    url_nc = 'http://tds.glos.us/thredds/dodsC/buoy_agg_standard/{0}/{1}.ncml'.format(loc_alias, loc_id)

    try:
        ds = open_url(url_nc);
    except Exception as e:
        # Error reporting:
        return {'message':'The requested data cannot be retrieved from the server at this time. '}

    try:
        # "times" list:
        lst_times = []      #empty list
        lst_times.extend(ds['time']);

        lst = ds['time'].units.split('since')
        tunit = lst[0].strip()
        tzero = datetime.strptime(lst[1].strip(), '%Y-%m-%d %H:%M:%S')

        # check data contains any of the requested time period
        data_Start_DateTime = tzero + timedelta(0, lst_times[0])
        data_End_DateTime = tzero + timedelta(0, lst_times[-1])

        if date_start > data_End_DateTime:
            return {'message': "Invalid start date. Available data are between %s and %s." % (data_Start_DateTime, data_End_DateTime)}
        elif date_end < data_Start_DateTime:
            return {'message': "Invalid end date. Available data are between %s and %s." % (data_Start_DateTime, data_End_DateTime)}

        # To avoid error, shrink request date range if it's wider than available data time range
        if date_start < data_Start_DateTime:
            date_start = data_Start_DateTime
        if date_end > data_End_DateTime:
            date_end = data_End_DateTime

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
                    idx = (len(lst_times) - 1)
                    lst_idx.append(idx)
                    continue
                except:
                    pass

            try:
                #Plan A: Find exact match at time 0:00 of actual start/end date:
                idx = lst_times.index(idsec)
            except:
                idx = -9999

                # Plan B: Scan for available viable dates/times to serve as start/end points:
                for delt_day in range(0, 365):           #Check for start date
                    date_tmp = date_chk + timedelta(lst_sign[i] * delt_day)    #check forward or backward, 1 day at a time
                    match_flg = False
                    
                    if (i == 0 and date_tmp > date_end): break
                    if (i == 1 and date_tmp < date_start): break

                    #Check if data available for current day:
                    delt_hr = 0
                    os_sec = lst_sign[i] * (86400*delt_day + (3600*delt_hr))
                    dt_tmp = date_chk + timedelta(seconds=os_sec)
                    try:
                        delt_sec = int((dt_tmp - tzero).total_seconds())
                        idx = lst_times.index(delt_sec)
                        break
                    except:
                        idx = -9999

                    # Check forward/backward in 10-minute increments (if necessary):
                    if (idx == -9999 and delt_day < 3):                
                        for delt_min in range(10,1430,10):
                            os_sec = lst_sign[i] * (86400*delt_day + (60*delt_min))
                            dt_tmp = date_chk + timedelta(seconds=os_sec)
                            delt_sec = int((dt_tmp - tzero).total_seconds())                                
                            
                            try:
                                idx = lst_times.index(delt_sec)
                                break
                            except:
                                idx = -9999

                    if (idx > 0):
                        break

                    #If data for current day, then loop backward to find start time to the hour:
                    #(check forward 23 hours from start date, or backward 23 hours from end date)
                    #if (idx != -9999):                    
                    #    for delt_hr in range(1,23):      
                    #        os_sec = lst_sign[i] * (86400*delt_day + (3600*delt_hr))
                    #        dt_tmp = date_chk + timedelta(seconds=os_sec)
                    #        try:
                    #            delt_sec = int((dt_tmp - tzero).total_seconds())
                    #            idx = lst_times.index(delt_sec)
                    #            break
                    #        except:         #Preserve index (on the day)
                    #            pass
                                #idx = -9999
                    #else:
                    #    pass     #No match on the day, so move on to next day...

            # Add time index to list:
            lst_idx.append(idx)

        # Return list of time indices (len=2):
        if (lst_idx[0] != lst_idx[1]):      #Indices can't be equal
            return lst_idx
        else:
            return [-9999, -9999]

    except Exception as inst:
        print(inst)
        return [-9999, -9999]


def getTSInterval(loc_id, loc_alias):

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

        url_nc = 'http://tds.glos.us/thredds/dodsC/buoy_agg_standard/{0}/{1}.ncml'.format(loc_alias, loc_id)

        try:
            ds = open_url(url_nc);

            # "times" list:
            lst_times = ds['time']

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

