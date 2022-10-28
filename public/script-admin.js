//Prompt for password on 
var authenticated = false;
var resultsArray = [];
var teacherId = -1;
var classId = -1;
var className = "";
var studentId = -1;
var studentName = "";

var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
var newDate = new Date();
var firstDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
var lastDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 1);

function setDates(){
  newDate = new Date();
  firstDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
  lastDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 1);
}


window.onload = function(e) {
  let password = prompt("Please enter your password:");
  //If they did not enter a password
  if (password == null || password == ""){
    showErrorDiv();
  }
  //Check the entered password
  else{
    var postRequest = new XMLHttpRequest();
    postRequest.onreadystatechange = function(){
      if (postRequest.readyState == XMLHttpRequest.DONE) {
        if (postRequest.responseText != "failure" ){
          showThePage(postRequest.responseText);
        }
        else{
          showErrorDiv();
        }
      }
    };
    postRequest.open("POST", "/passwordCheck");
    postRequest.setRequestHeader(
      "Content-Type",
      "application/json;charset=UTF-8"
    );
    var jsonObj = {
    password: password
  };
  postRequest.send(JSON.stringify(jsonObj));
  }
};

function showThePage(loggedInTeacher){
  authenticated = true;
  document.getElementById("pageDiv").style.display = "block";
  teacherId = loggedInTeacher;
  getJsonData(loggedInTeacher);
}

function showErrorDiv(){
  authenticated = false;
  document.getElementById("errorDiv").style.display = "block";
}

function getJsonData(loggedInTeacher){
  //Get classes for teacher
  $.post("/getClassesByTeacherId", { teacherId: loggedInTeacher }, function(
      response
    ) {
      var classArr = JSON.parse(response);
      var $dropdown = $("#className");
      $dropdown.empty();
      $.each(classArr, function() {
        $dropdown.append(
          $("<option />")
            .val(this.rowid)
            .text(this.ClassName)
        );
      });
    
    classId = classArr[0].rowid;
    className = classArr[0].ClassName;
    $("#currentFilter").html("<a class='underline' onclick='clickedAllResults()'>Results for " + className + "</a>");
    
    
    //Get the most recent score for each student, for the class.
    //Default to use the first class.
  
    $.post("/results", {teacherId: loggedInTeacher, classId: classId}, function(responseText
      ){
      addRows(responseText);
     })
  });
}

function addRows(json){
  var tableElem = document.getElementById("jsonTable");
  var array = JSON.parse(json);
  resultsArray = array;
  for (var i = 0; i < array.length; i++){
    var trElem = document.createElement("tr");
    var obj = array[i];

    //initialize tdElem
    var tdElem;
    
    //column 1 - row id
    //tdElem = document.createElement("td");
    //tdElem.innerHTML = obj.rowid;
    //tdElem.classList.add("gray");
    //trElem.appendChild(tdElem);
    
    //column 2 - date/time
    tdElem = document.createElement("td");
    var date = new Date(obj.DateTime + ' UTC');
    var hours = date.getHours();
    var dateString = (date.getMonth()+1) + '/' + date.getDate() + '/' +  date.getFullYear() + " " +
        (hours % 12 ? hours % 12 : 12) + ":" +
        (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ' ' +
        (hours >= 12 ? 'PM' : 'AM');
    tdElem.innerHTML = dateString;
    tdElem.classList.add("gray");
    trElem.appendChild(tdElem);
    
    //column 3 - student name
    tdElem = document.createElement("td");
    tdElem.innerHTML = obj.StudentName;
    tdElem.classList.add("gray");
    tdElem.classList.add("underline");
    tdElem.onclick = function (curObj) { return function(){clickedStudentName(curObj)}}(obj);
    trElem.appendChild(tdElem);
    
    //column 4 - teacher name
    tdElem = document.createElement("td");
    tdElem.innerHTML = obj.TeacherName;
    tdElem.classList.add("gray");
    trElem.appendChild(tdElem);
    
    //column 5 - class name
    tdElem = document.createElement("td");
    tdElem.innerHTML = obj.Class;
    tdElem.classList.add("gray");
    //tdElem.classList.add("underline");
    //tdElem.onclick = function (curObj) { return function(){clickedClassName(curObj)}}(obj);
    trElem.appendChild(tdElem);
    
    //column 6 - correct answers
    tdElem = document.createElement("td");
    tdElem.innerHTML = obj.CorrectQuestions;
    tdElem.classList.add("gray");
    trElem.appendChild(tdElem);
    
    //column 7 - questions answered
    tdElem = document.createElement("td");
    tdElem.innerHTML = obj.QuestionsAnswered;
    tdElem.classList.add("gray");
    trElem.appendChild(tdElem);
    
    //column 8 - percentage
    tdElem = document.createElement("td");
    var percentage = "0%";
    if (obj.QuestionsAnswered > 0)
      percentage = Math.round((obj.CorrectQuestions / obj.QuestionsAnswered) * 100) + "%";
    tdElem.innerHTML = percentage;
    tdElem.classList.add("gray");
    trElem.appendChild(tdElem);
    
    //column 9 - time elapsed
    tdElem = document.createElement("td");
    tdElem.innerHTML = obj.TimeElapsed;
    tdElem.classList.add("gray");
    trElem.appendChild(tdElem);
    
    //column 10 - operation
    tdElem = document.createElement("td");
    tdElem.innerHTML = obj.Operation;
    tdElem.classList.add("gray");
    trElem.appendChild(tdElem);
    
    //column 11 - smart score
    tdElem = document.createElement("td");
    tdElem.innerHTML = obj.SmartScore;
    tdElem.classList.add("gray");
    trElem.appendChild(tdElem);
    
    tableElem.appendChild(trElem);
  }
}

function clickedAllResults(){
  $("#currentFilter").html("<a class='underline' onclick='clickedAllResults()'>Results for " + className + "</a>");
  $("#jsonTable tr:gt(0)").remove();
  $("#monthLinks").hide();
  Plotly.purge("gd");
  
  $.post("/results", { teacherId: teacherId, classId: classId }, function(response){
    addRows(response);
  });
}

function clickedStudentName(dataObj){
  //Change the filter header.
  $("#currentFilter").html("<a class='underline' onclick='clickedAllResults()'>Results for " + className + "</a>");
  $("#currentFilter").append("<span> > </span>")
  $("#currentFilter").append("<a class='underline'>" + dataObj.StudentName +"</a>");
  
  setDates();
  $("#monthLinks").show();
  $("#monthAndYearLabel").html(monthNames[firstDayOfMonth.getMonth()] + " " + firstDayOfMonth.getFullYear());
  
  //Remove all current results, but not the headers.
  $("#jsonTable tr:gt(0)").remove();
  
  studentId = dataObj.StudentId;
  studentName = dataObj.StudentName;
  
  //Get the new data.
  $.post("/resultsByStudentId", {teacherId: teacherId, studentId: dataObj.StudentId, startDate: firstDayOfMonth.toISOString().split('T')[0], endDate: lastDayOfMonth.toISOString().split('T')[0]}, function (response){
    addRows(response);
    buildChart(dataObj.StudentName);
  });
}

function changedClass(){
  classId = $("#className option:selected").val();
  className = $("#className option:selected").text();
  
  $("#currentFilter").html("<a class='underline' onclick='clickedAllResults()'>Results for " + className + "</a>");
  $("#jsonTable tr:gt(0)").remove();
  $("#monthLinks").hide();
  Plotly.purge("gd");
  
  $.post("/results", { teacherId: teacherId, classId: classId }, function(response){
    addRows(response);
  });
  
}

function clickedPreviousMonth(){
    //Add to the months
    firstDayOfMonth = new Date(firstDayOfMonth.setMonth(firstDayOfMonth.getMonth() - 1));
    lastDayOfMonth = new Date(lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() - 1));
    
    //Change the filter header.
    $("#currentFilter").html("<a class='underline' onclick='clickedAllResults()'>Results for " + className + "</a>");
    $("#currentFilter").append("<span> > </span>")
    $("#currentFilter").append("<a class='underline'>" + studentName +"</a>");
  
    $("#monthLinks").show();
    $("#monthAndYearLabel").html(monthNames[firstDayOfMonth.getMonth()] + " " + firstDayOfMonth.getFullYear());
  
    //Remove all current results, but not the headers.
    $("#jsonTable tr:gt(0)").remove();
    
    //Get the new data.
    $.post("/resultsByStudentId", {teacherId: teacherId, studentId: studentId, startDate: firstDayOfMonth.toISOString().split('T')[0], endDate: lastDayOfMonth.toISOString().split('T')[0]}, function (response){
      addRows(response);
      buildChart(studentName);
    });
}

function clickedNextMonth(){
  //Check if next month is in the future. If so, don't do anything.
  var tempDate = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 1);
  if (tempDate < newDate){
    //Add to the months
    firstDayOfMonth = new Date(firstDayOfMonth.setMonth(firstDayOfMonth.getMonth() + 1));
    lastDayOfMonth = new Date(lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1));
    
    //Change the filter header.
    $("#currentFilter").html("<a class='underline' onclick='clickedAllResults()'>Results for " + className + "</a>");
    $("#currentFilter").append("<span> > </span>")
    $("#currentFilter").append("<a class='underline'>" + studentName +"</a>");
  
    $("#monthLinks").show();
    $("#monthAndYearLabel").html(monthNames[firstDayOfMonth.getMonth()] + " " + firstDayOfMonth.getFullYear());
    
    //Remove all current results, but not the headers.
    $("#jsonTable tr:gt(0)").remove();
    
    //Get the new data.
    $.post("/resultsByStudentId", {teacherId: teacherId, studentId: studentId, startDate: firstDayOfMonth.toISOString().split('T')[0], endDate: lastDayOfMonth.toISOString().split('T')[0]}, function (response){
      addRows(response);
      buildChart(studentName);
    });
  }
}

/*
function clickedClassName(dataObj){
  //Change the filter header.
  $("#currentFilter").html("<a class='underline' onclick='clickedAllResults()'>Results for " + className + "</a>");
  $("#currentFilter").append("<span> > </span>")
  $("#currentFilter").append("<a class='underline'>" + dataObj.Class +"</a>");
  //Remove all current results, but not the headers.
  $("#jsonTable tr:gt(0)").remove();
  Plotly.purge("gd");
  //Get the new data.
  $.post("/resultsByClassId", {teacherId: teacherId, classId: dataObj.ClassId}, function(response){
    addRows(response);
  });
}
*/

function buildChart(studentName){
  var yArr = [];
  var xArr = [];
  var textArr = [];
  
  for (var i = resultsArray.length - 1; i >= 0; i--){
    var obj = resultsArray[i];
    
    var date = new Date(obj.DateTime + ' UTC');
    var hours = date.getHours();
    var dateString = (date.getMonth()+1) + '/' + date.getDate() + "<br>" +
        (hours % 12 ? hours % 12 : 12) + ":" +
        (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) +
        (hours >= 12 ? 'PM' : 'AM');
    
    xArr.push(dateString);
    yArr.push(obj.SmartScore || 0);
    textArr.push(obj.SmartScore || 0);
  }
  
  var data = [
    {
      y: yArr,
      x: xArr,
      type: "bar",
      marker: {
        color: 'royalblue'
      },
      text: textArr
    }
  ];
  
  var layout = {
      title: {
        text: monthNames[firstDayOfMonth.getMonth()] + " " + firstDayOfMonth.getFullYear() + " - " + studentName + "'s Smart Scores",
        font: {
          family: 'Lato, sans-serif',
          size: 24
        }
      },
      paper_bgcolor:"#4169E100",
      height: 700,
      xaxis: {
        type: "category",
        tickangle: 0,
        title: {
          text: "Attempt",
          font: {
            family: 'Lato, sans-serif',
            size: 18
          }
        },
        font: {
          family: 'Lato, sans-serif',
          size: 18
        }
      },
      yaxis: {
        title:{
          text: "Smart Score",
          font: {
            family: 'Lato, sans-serif',
            size: 18
          }
        },
        range: [0, 100]
      }
    };
  
  Plotly.newPlot("gd", data, layout, {
    displayModeBar: false,
    staticPlot: true,
    responsive: true
  });
}