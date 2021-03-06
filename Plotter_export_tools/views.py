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
import xarray
import xlsxwriter
import pandas as pd

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


# download data to 'csv' or 'xls' format
# now support 'xlsx' format
def download_data(request):

    file_type = request.GET.get('ftype','')  # csv / xls
    unit_type = request.GET.get('units','')  # metric / english

    # get the parameters
    data_type, lst_locs, lst_params, str_date1, str_date2, dct_owners, avg_ivld = queryRequestVars(request, 'GET')

    # Define file name:
    strLocs = "-".join(lst_locs)
    strDateNow = datetime.now().strftime("%Y-%M-%D")

    filename = 'GLOS_data_export_' + strLocs #+ '_' + strDateNow

    dct_response = getTSData_fast(request, 'GET')

    if isinstance(dct_response, dict) and dct_response['err_flag']:

        #return HttpResponseNotFound('<h1>' + dct_response['message'] + '</h1>')
        #raise Http404(dct_response['message'])
        html = "<html><body>Error message: %s</body></html>" % dct_response['message']
        return HttpResponse(html, status=500)

    # convert to English units
    if unit_type == 'eng':
        for loc in lst_locs:
            dctLoc = dct_response['locations'][loc][lst_params]

            for param in lst_params:
                if param not in dctLoc.variables:
                    continue
                var = dctLoc.variables[param]
                newvals, newunit = metricToEnglish(var.values,
                                                   var.attrs.get("units", ""))
                if newvals is not None:
                    dctLoc.variables[param][:] = newvals
                    dctLoc.variables[param].attrs['units'] = newunit

    var_units = (dctLoc.variables[var].attrs.get("units", "") for var in
                    lst_params)
    loc = next(iter(dct_response['locations'].keys()))
    df = (dct_response['locations'][loc][lst_params].to_dataframe()
            [lst_params])

    var_units = (dctLoc.variables[var].attrs.get("units", "") for var in
                    lst_params)

    def rename_columns_add_units(dctLoc, var_name):
        return "{} ({})".format(var_name,
                                dctLoc.variables[var_name].attrs.get(
                                                                "units",
                                                                ""))
    dctLoc = dct_response['locations'][loc][lst_params]
    df.rename(columns=lambda n: rename_columns_add_units(dctLoc, n),
              inplace=True)
    df.index.name = "Date/Time (UTC)"
    # source: http://thepythondjango.com/download-data-csv-excel-file-in-django/
    if file_type == 'csv':
    # TODO: adapt to CSV output of GLBuoys export -- one space after and
    #
        df.reset_index(inplace=True)
        df.columns = pd.MultiIndex.from_tuples([(loc, "Date/Time (UTC)")] +
                                            [("", param) for param in
                                                lst_params],
                                            names=("station", "variables"))

        # response content type
        response = HttpResponse(content_type='text/csv')
        #decide the file name
        response['Content-Disposition'] = 'attachment; filename="' + filename + "." + file_type + '"'
        # TODO: add unit columns
        response.write(df.to_csv(index=False))

        return response

    elif file_type=='xls' or file_type=='xlsx':
        excel_io = io.BytesIO()

        def write_excel_data():
            excel_writer = pd.ExcelWriter(excel_io, engine=writer)


            #other rows
            df.to_excel(excel_writer, sheet_name=loc, startrow=5)
            workbook = excel_writer.book
            sheet = excel_writer.sheets[loc]
            sheet.write(0, 0, "Station ID:")
            sheet.write(0, 1, loc)

            sheet.write(1, 0, "Station Description:")
            sheet.write(1, 1, loc)
            excel_writer.save()
            excel_io.seek(0)


        # call excel generator
        # content-type of response
        if file_type == "xls":
            content_type = 'application/ms-excel'
            writer = "xlwt"
            write_excel_data()

        else:
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            writer = "xlsxwriter"
            write_excel_data()

        excel_io.seek(0)
        response = HttpResponse(content_type=content_type)
        response['Content-Disposition'] = ('attachment; filename="' + filename +
                                        "." + file_type + '"')
        response.write(excel_io.read())
        excel_io.close()

        return response

    else:
        return


download_data.short_description = "Export data"


#==================================================================================
#-  AJAX URLs
#==================================================================================

def getTSData(request):

    dct_response = getTSData_fast(request, 'POST')
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
        #dct_response['locations'][loc_id] = {}
        #dct_response['locations'][loc_id] = {}
        #dct_response['locations'][loc_id]['dattim'] = []
        #dct_response['locations'][loc_id]['params'] = []

        # Get time index:
        # TODO: handle missing variables
        ds_raw = getTimeIndices(loc_id, loc_alias,
                                date_start, date_end)[lst_params]

        if isinstance(ds_raw, dict):
            dct_response['err_flag'] = True
            dct_response['message'] = ds['message']
            return dct_response
        elif isinstance(ds_raw, list) and ds_raw == [-9999, -9999]:
            dct_response['err_flag'] = True
            dct_response['message'] = "An error occurred while fetching data"
            return dct_response
        elif isinstance(ds_raw, xarray.Dataset):
            # load into memory prior to executing any operations
            ds_raw.load()

            if avg_ivld != "none":
                # T is an offset string for minutes here
                avg_min_string = "{}T".format(get_interval_in_mins(avg_ivld))
                ds = ds_raw.resample(time=avg_min_string,
                                     keep_attrs=True).mean()
                # units get lost when averaging, even in spite of keep_attrs,
                # so we need to reassign them
                for var_name in lst_params:
                    ds.variables[var_name].attrs["units"] = ds_raw.variables[var_name].attrs.get("units", "")
            else:
                ds = ds_raw
            del ds_raw
        # TODO: DRY up?
        else:
            dct_response['err_flag'] = True
            dct_response['message'] = "An error occurred while fetching data"
            return dct_response

        dct_response['locations'][loc_id] = ds
        #dct_response = process_interval_avg(dct_response, avg_ivld)

        #tidx1 = lst_timerng[0]; tidx2 = lst_timerng[1]

        # Initialize parameters in data dictionary:
        for param_id in lst_params:
            dct_data[param_id] = {}                  #empty dict.
            dct_data[param_id]['values'] = []       #empty list
            dct_data[param_id]['units'] = ''
            dct_data[param_id]['desc'] = ''

        lst_times = []
        lst_dattim  = []
        initFlag = True

        if True:
        #if ds != [-9999, -9999]:
        #if (tidx1 >= 0 and tidx2 >= 0):

            #-------------------------------------------------------
            #- "Buoy" monitoring type:
            #-------------------------------------------------------
            if (data_type == 'buoy'):

                # Construct URL for OpenDAP access of date-specific netCDF file (** currently hardcoded for buoys**):
                #url_nc = 'http://tds.glos.us/thredds/dodsC/buoy_agg_standard/{0}/{1}.ncml'.format(loc_alias, loc_id)

                try:
                    try:
                        pass
                        #ds = open_url(url_nc);
                        #ds = xarray.open_dataset(url_nc)
                    except Exception as e:
                        # Error reporting:
                        dct_response['err_flag'] = True
                        dct_response['status'] = 'abort'
                        strMsg = 'The requested data cannot be retrieved from the server at this time. '

                        if (dct_owners[loc_id] == 'NOAA-NDBC'):
                            strMsg += 'Please note that this viewer does not support NOAA NDBC buoys that are not directly supported in the GLOS DMAC.'

                        dct_response['message'] = strMsg
                        return dct_response

                    initFlag = False

                # is this block used?  If so, TODO: adapt to xarray data
                # structures.
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

        else:
            dct_response['err_flag'] = True
            dct_response['message'] = 'No data for the requested selected period!'
            return dct_response
        #--------------------------------------------------------
        #- End location loop
        #--------------------------------------------------------

    return dct_response


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
    if type == 'POST':
        dct_request = request.POST.dict()
    elif type == 'GET':
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
    return (data_type, lst_locs, lst_params, str_date1, str_date2, dct_owners,
            avg_ivld)


# Function to provide iteration over date range between two dates:
def dateRange(start_date, end_date):
    for n in range(int((end_date - start_date).days)):
        yield start_date + timedelta(n)



# Function to return a list with indices referencing the start date and end date:
def getTimeIndices(loc_id, loc_alias, date_start, date_end):

    url_nc = 'http://tds.glos.us/thredds/dodsC/buoy_agg_standard/{0}/{1}.ncml'.format(loc_alias, loc_id)

    try:
        #ds = open_url(url_nc);
        ds = xarray.open_dataset(url_nc, decode_cf=True, decode_times=True)
    except Exception as e:
        # Error reporting:
        return {'message': 'The requested data cannot be retrieved from the server at this time. '}

    try:
        data_Start_DateTime = ds.coords['time'].values.min()
        data_End_DateTime = ds.coords['time'].values.max()


        if np.datetime64(date_start) > data_End_DateTime:
            return {'message': "Invalid start date. Available data are between %s and %s." % (data_Start_DateTime, data_End_DateTime)}
        elif np.datetime64(date_end) < data_Start_DateTime:
            return {'message': "Invalid end date. Available data are between %s and %s." % (data_Start_DateTime, data_End_DateTime)}

        ds_filt = ds.sel(time=slice(np.datetime64(date_start),
                                    np.datetime64(date_end)))

        if len(ds_filt) > 1:      #Indices can't be equal
            return ds_filt
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
    intcpt = 0
    new_unit = met_unit

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

    if cnvFactor != 1 or intcpt != 0:
        new_values = values * cnvFactor + intcpt
        return new_values, new_unit
    else:
        return None, met_unit

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

