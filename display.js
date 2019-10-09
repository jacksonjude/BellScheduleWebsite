const rootHost = "https://lowellschedule.herokuapp.com"
const todayHost = rootHost + "/today/"
const tomorrowHost = rootHost + "/tomorrow/"

function getJSON(dataSource, arguments)
{
  var jsonPromise = new Promise((resolve, reject) => {
    $("#loader").show()
    $.getJSON(dataSource, arguments, function(data)
    {
      $("#loader").hide()
      resolve(data)
    })
  })

  return jsonPromise
}

$.ajaxSetup({
  //Disable caching of AJAX responses
  cache: false
})

$(function()
{
  reloadScheduleData()
})

function reloadScheduleData()
{
  reloadTodayScheduleData()
  reloadTomorrowScheduleData()
}

async function reloadTodayScheduleData()
{
  var todayScheduleData = await getJSON(todayHost, {})

  if (todayScheduleData.error != undefined) { $("#blockNumber").text("Error: " + todayScheduleData.error); return }
  if (todayScheduleData.scheduleCode == "H") { $("#blockNumber").text("No school today"); return }

  var periodTimes = todayScheduleData.periodTimes
  var periodNumbers = todayScheduleData.periodNumbers

  var nowHour = (new Date()).getHours()
  var nowMinute = (new Date()).getMinutes()
  var currentPeriodNumber
  var lastEndHour
  var lastEndMinute
  var isPassingPeriod = false
  for (var i=0; i < periodTimes.length; i++)
  {
    var startTime = periodTimes[i].split("-")[0]
    var endTime = periodTimes[i].split("-")[1]

    var startHour = parseInt(startTime.split(":")[0])
    var startMinute = parseInt(startTime.split(":")[1])
    var endHour = parseInt(endTime.split(":")[0])
    var endMinute = parseInt(endTime.split(":")[1])

    if (nowHour >= startHour && nowHour <= endHour && nowMinute >= startMinute && nowMinute < endMinute)
    {
      currentPeriodNumber = i
      break
    }
    else if ((lastEndHour < nowHour || (lastEndHour == nowHour && lastEndMinute <= nowMinute)) && (startHour > nowHour || (startHour == nowHour && startMinute > nowMinute)))
    {
      isPassingPeriod = true
      currentPeriodNumber = i
      break
    }

    lastEndHour = endHour
    lastEndMinute = endMinute
  }

  var schoolStarted
  var schoolEnded

  if (currentPeriodNumber != undefined && !isPassingPeriod)
  {
    $("#blockNumber").text("The current period is " + periodNumbers[currentPeriodNumber])
    $("#blockTime").text(periodTimes[currentPeriodNumber])

    schoolStarted = true
    schoolEnded = false
  }
  else if (isPassingPeriod)
  {
    $("#blockNumber").text("Passing period\nBlock " + periodNumbers[currentPeriodNumber] + " starts at " + periodTimes[currentPeriodNumber].split("-")[0])

    schoolStarted = true
    schoolEnded = false
  }
  else
  {
    var schoolStartHour = parseInt(periodTimes[0].split("-")[0].split(":")[0])
    var schoolStartMinute = parseInt(periodTimes[0].split("-")[0].split(":")[1])
    var schoolEndHour = parseInt(periodTimes[periodTimes.length-1].split("-")[1].split(":")[0])
    var schoolEndMinute = parseInt(periodTimes[periodTimes.length-1].split("-")[1].split(":")[1])

    if (nowHour < schoolStartHour || (nowHour == schoolStartHour && nowMinute < schoolStartMinute))
    {
      $("#blockNumber").text("School has not started yet")

      schoolStarted = false
      schoolEnded = false
    }
    else if (nowHour > schoolEndHour || (nowHour == schoolEndHour && nowMinute >= schoolEndMinute))
    {
      $("#blockNumber").text("School has ended")

      schoolStarted = true
      schoolEnded = true
    }
  }

  $("#todayStart").text("School " + (schoolStarted ? " started " : " will start ") + " today at " + periodTimes[0].split("-")[0])
  $("#todayEnd").text("School " + (schoolEnded ? " ended " : " will end ") + " today at " + periodTimes[periodTimes.length-1].split("-")[1])
}

async function reloadTomorrowScheduleData()
{
  var tomorrowScheduleData = await getJSON(tomorrowHost, {})
  var tomorrowDate = new Date(tomorrowScheduleData.date)

  if (tomorrowScheduleData.error != undefined) { $("#tomorrowDate").text("Error: " + tomorrowScheduleData.error); return }

  $("#tomorrowDate").text("School starts on " + tomorrowDate.getMonth() + "/" + tomorrowDate.getDate())
  $("#tomorrowStart").text("at " + tomorrowScheduleData.periodTimes[0].split("-")[0])
}
