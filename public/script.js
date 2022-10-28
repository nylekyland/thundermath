//Timer function variable!
var timerInterval;
//Set default time to 4 minutes
const defaultMinutes = 4;
var minutes = 4;
//Set time in seconds
var timeRemaining = 60 * minutes;

var timeElapsed = 0;

//Variables for the math problem.
var topNum, bottomNum, answer;

//Get counts of correct & incorrect answers
var correctCount = 0;
var incorrectCount = 0;

//Number of questions
var currentQuestionCount = 1;
var totalQuestionCount = 5;

//Smart Score
var smartScore = 0;

//States
var incorrectAnswerState = false;
var answerCheckState = false;
var ghostAnswerState = false;

//Store the facts
var topNumbersArray = [];
var bottomNumbersArray = [];
var answersArray = [];
var correctIncorrectArray = [];

var selectedTeacher = "";
var selectedOperation = "Multiplication";

//Operation Codes:
// 0 = Multiplication (0 - 12)
// 1 = Multiplication (0 - 5)
// 2 = Addition (0 - 10)

var teacherArray = [];
var studentArray = [];
var selectedStudent = {};

var monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
var newDate = new Date();
var firstDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
var lastDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 1);

function setDates() {
  newDate = new Date();
  firstDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
  lastDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 1);
}

var showClassSettingsFlag = false;

//On page load, set timer & numbers
window.onload = function (e) {
  
  $('#mathTable').bind('click', function(e) {
    console.log("clicked on math table");
    $('#text-input').focus();
  });
  
  hideClassSettings();

  //Signify that we're loading data.
  $("#teacher").empty();
  $("#teacher").append($("<option />").text("Loading..."));

  $("#className").empty();
  $("#className").append($("<option />").text("Loading..."));

  $("#childName").empty();
  $("#childName").append($("<option />").text("Loading..."));

  //Populate the teacher dropdown. Send a GET request.

  $.get("/getTeachers", function (response) {
    var jsonArr = JSON.parse(response);
    var $dropdown = $("#teacher");
    $dropdown.empty();
    $.each(jsonArr, function () {
      $dropdown.append($("<option />").val(this.rowid).text(this.TeacherName));
    });

    selectedTeacher = jsonArr[0].TeacherName;

    //Populate the class dropdown based on the first result.
    $.post(
      "/getClassesByTeacherId",
      { teacherId: jsonArr[0].rowid },
      function (response) {
        var classArr = JSON.parse(response);
        var $dropdown = $("#className");
        $dropdown.empty();
        $dropdown.append(
          $("<option />").val("").text("Please select a class:")
        );
        $.each(classArr, function () {
          $dropdown.append(
            $("<option />").val(this.rowid).text(this.ClassName)
          );
        });
      }
    );
    $("#childName").empty();
    $("#childName").append(
      $("<option />").val("").text("Please select a name:")
    );
  });
};

//Every second, decrement the timer and set the string.
function timer() {
  setTimerElement();

  if (timeRemaining <= 0) {
    clearInterval(timerInterval);
    setTimesUp();
    hideGameScreen();
    showResultsScreen();
  } else {
    timeElapsed++;
    timeRemaining--;
  }
}

//Handle key presses
document.addEventListener("keydown", function (e) {
  //Player typed a number (regular number or Numpad)
  //only works if they've typed <3 numbers.
  if (
    (!(isNaN(e.key) || e.key === null || e.key === ' ')) &&
    !answerCheckState &&
    (document.getElementById("answerNum").innerHTML.length < 3 ||
      ghostAnswerState)
  ) {
    if (ghostAnswerState) {
      ghostAnswerState = false;
      document.getElementById("answerNum").innerHTML = "";
      clearGhostAnswer();
    }
    document.getElementById("answerNum").innerHTML += e.key;
  }
  //Backspace and delete
  if (
    (e.key === 'Backspace' || e.key === 'Delete') &&
    !answerCheckState &&
    !ghostAnswerState
  ) {
    document.getElementById("answerNum").innerHTML = document
      .getElementById("answerNum")
      .innerHTML.slice(0, -1);
  }
  //Pressed enter, check their math!
  if (
    document.getElementById("answerNum").innerHTML.length > 0 &&
    e.key === 'Enter' &&
    !answerCheckState &&
    !ghostAnswerState
  ) {
    answerCheckState = true;
    checkAnswer();
  }
});

function setNumbers() {
  if (selectedOperation == "Multiplication") var operationValue = 0;
  else if (selectedOperation == "Multiplication2") var operationValue = 1;
  //var e = document.getElementById("operationMultiplication");
  else if (selectedOperation == "Addition") var operationValue = 2;
  //var e = document.getElementById("operationAddition");
  //var operationValue = parseInt(e.options[e.selectedIndex].value);
  var topLimit = 13;

  switch (operationValue) {
    //Default / 0: Multiplication (0 - 12)
    case 0:
    default:
      topLimit = 13;
      break;
    // 1: Multiplication (0 - 5)
    case 1:
      topLimit = 6;
      break;
    // 2: Addition (0 - 10)
    case 2:
      topLimit = 11;
      break;
  }

  //top number
  topNum = Math.floor(Math.random() * topLimit);
  //bottom number
  bottomNum = Math.floor(Math.random() * topLimit);
  //answer

  if (operationValue < 2) answer = topNum * bottomNum;
  else answer = topNum + bottomNum;

  //Store these values
  topNumbersArray.push(topNum);
  bottomNumbersArray.push(bottomNum);
  answersArray.push(answer);

  //Set top number value in the HTML
  document.getElementById("firstNum").innerHTML = topNum;
  document.getElementById("secondNum").innerHTML = bottomNum;
  if (operationValue < 2)
    document.getElementById("operationSymbol").innerHTML = "&times;";
  else document.getElementById("operationSymbol").innerHTML = "&plus;";

  //Clear the answer
  document.getElementById("answerNum").innerHTML = "";
}

function setTimerElement() {
  var timerElement = document.getElementById("timer");

  var minutes = parseInt(timeRemaining / 60, 10);
  var seconds = parseInt(timeRemaining % 60, 10);

  seconds = seconds < 10 ? "0" + seconds : seconds;

  timerElement.innerHTML = minutes + ":" + seconds;
}

function checkAnswer() {
  var userAnswer = parseInt(document.getElementById("answerNum").innerHTML);
  //they got it correct
  if (userAnswer == answer) {
    //They got the correct answer on the first guess
    if (!incorrectAnswerState) {
      correctCount++;
      correctIncorrectArray.push(1);
    }
    setCheckmark();
    setGreen();
    incorrectAnswerState = false;
    setTimeout(function () {
      currentQuestionCount++;
      setPercentageElement();
      setQuestionNumberElement();
      removeColor();
      removeSymbol();
      answerCheckState = false;
      //they finished all of the questions
      if (currentQuestionCount > totalQuestionCount) {
        clearInterval(timerInterval);
        hideGameScreen();
        setCongrats();
        showResultsScreen();
      } else setNumbers();
    }, 600);
  }
  //they got it incorrect
  else {
    //This the first time they got the problem wrong.
    if (!incorrectAnswerState) {
      incorrectCount++;
      correctIncorrectArray.push(0);
      incorrectAnswerState = true;
    }
    incorrectAnswerState = true;
    setCross();
    setRed();
    setTimeout(function () {
      removeSymbol();
      removeColor();
      setPercentageElement();
      clearAnswer();
      setGhostAnswer();
      ghostAnswerState = true;
      answerCheckState = false;
    }, 600);
  }
}

function setQuestionNumberElement() {
  var elem = document.getElementById("currentQuestionNumber");
  elem.innerHTML =
    "Question " + currentQuestionCount + " / " + totalQuestionCount;
}

function setPercentageElement() {
  var elem = document.getElementById("correctPercentage");
  if (currentQuestionCount == 1) {
    elem.innerHTML = "0%";
  } else {
    elem.innerHTML =
      Math.round((correctCount / (correctCount + incorrectCount)) * 100) + "%";
  }
}

function setCheckmark() {
  document.getElementById("answerNum").innerHTML = answer;
  document.getElementById("symbol").innerHTML = '<i class="fal fa-check"></i>';
}

function setCross() {
  document.getElementById("symbol").innerHTML = '<i class="fal fa-times"></i>';
}

function removeSymbol() {
  document.getElementById("symbol").innerHTML = "";
}

function setGreen() {
  document.getElementById("gameArea").classList.add("green");
}

function setRed() {
  document.getElementById("gameArea").classList.add("red");
}

function removeColor() {
  document.getElementById("gameArea").classList.remove("green");
  document.getElementById("gameArea").classList.remove("red");
}

function clearAnswer() {
  $("#answerNum").innerHTML = "";
  $('#text-input').val('');
}

function setGhostAnswer() {
  document.getElementById("answerNum").innerHTML = answer;
  document.getElementById("answerNum").classList.add("ghost");
}

function clearGhostAnswer() {
  document.getElementById("answerNum").innerHTML = "";
  document.getElementById("answerNum").classList.remove("ghost");
}

function hideGameScreen() {
  document.getElementById("game").style.display = "none";
}

function showGameScreen() {
  document.getElementById("game").style.display = "block";
}

function showTitleScreen() {
  document.getElementById("title").style.display = "block";
}

function hideTitleScreen() {
  document.getElementById("title").style.display = "none";
}

function hideResultsScreen() {
  document.getElementById("results").style.display = "none";
}

function showResultsScreen() {
  document.getElementById("results").style.display = "block";
  $('#text-input').blur();
  var totalCount = correctCount + incorrectCount;
  //document.getElementById("currentQuestionCount").innerHTML = totalCount;
  //document.getElementById("correctQuestionsCount").innerHTML = correctCount;

  //Get time elapsed
  var minutes = parseInt(timeElapsed / 60, 10);
  var seconds = parseInt(timeElapsed % 60, 10);
  seconds = seconds < 10 ? "0" + seconds : seconds;
  //document.getElementById("timeElapsed").innerHTML = minutes + ":" + seconds;

  //Get the "Smart Score"
  //"Smart Score" definition: The average of your accuracy (# correct / # answered)
  //and the completion (# correct / total questions (100))
  var smartScore =
    totalCount > 0
      ? Math.ceil(
          ((correctCount / totalCount) * 100 +
            (correctCount / totalQuestionCount) * 100) /
            2
        )
      : 0;

  //Fill the grid
  if (selectedOperation == "Multiplication")
    //var operationElem = document.getElementById("operationMultiplication");
    var operationText = "Multiplication (0 - 12)";
  else if (selectedOperation == "Multiplication2")
    var operationText = "Multiplication (0 - 5)";
  else if (selectedOperation == "Addition")
    //var operationElem = document.getElementById("operationAddition");
    var operationText = "Addition (0 - 10)";
  document.getElementById("operationGrid").innerHTML =
    //operationElem.options[operationElem.selectedIndex].innerHTML;
    operationText;
  document.getElementById("timeGrid").innerHTML = minutes + ":" + seconds;
  document.getElementById("questionsGrid").innerHTML =
    correctCount + " / " + totalCount;
  document.getElementById("smartScore").innerHTML = smartScore;
  document.getElementById("totalQuestionsGrid").innerHTML =
    totalQuestionCount + " Questions";

  setPercentageElement();

  if (showClassSettingsFlag) {
    $("#chart").show();
    $("#teacherResults").show();
    $("#classResults").show();
    $("#childResults").show();
    document.getElementById("teacherGrid").innerHTML = selectedTeacher;
    $("#classGrid").html($("#className option:selected").text());
    $("#nameGrid").html($("#childName option:selected").text());
    submitData();
  } else {
    $("#chart").hide();
    $("#teacherResults").hide();
    $("#classResults").hide();
    $("#childResults").hide();
  }
}

function setTimesUp() {
  document.getElementById("timesUp").innerHTML = "Time's Up!";
}

function setCongrats() {
  document.getElementById("timesUp").innerHTML = "Great Job, You Finished!";
}

function startGame() {
  //check if they've entered a class and a name first
  var className = null;
  var childName = null;

  if (showClassSettingsFlag) {
    className = $("#className option:selected").val();
    childName = $("#childName option:selected").val();

    if (!className) showClassNameError();
    if (!childName) showChildNameError();
  }

  if (
    !showClassSettingsFlag ||
    (showClassSettingsFlag && className && childName)
  ) {
    
    window.scrollTo(0, 0);
    
    //Reset time
    minutes = defaultMinutes;
    timeRemaining = 60 * minutes;
    timeElapsed = 0;

    //Get counts of correct & incorrect answers
    correctCount = 0;
    incorrectCount = 0;

    //Number of questions
    currentQuestionCount = 1;

    //Hide reuslts
    hideTitleScreen();
    showGameScreen();

    //Reset the history
    topNumbersArray = [];
    bottomNumbersArray = [];
    answersArray = [];
    correctIncorrectArray = [];

    //Set the numbers
    setNumbers();

    //Start the timer (1000ms = 1s)
    timerInterval = setInterval(timer, 1000);

    //Set the question number text
    setTimerElement();
    setQuestionNumberElement();
  }
}

function playAgain() {
  hideResultsScreen();
  showTitleScreen();
  window.scrollTo(0, 0);
}

function changedClass() {
  if ($("#className option:selected").val()) {
    hideClassNameError();

    //Signify that we're loading the student name data
    $("#childName").empty();
    $("#childName").append($("<option />").text("Loading..."));

    //Populate the student name dropdown.
    $.post(
      "/getStudentsByClassId",
      { classId: $("#className option:selected").val() },
      function (response) {
        var studentArr = JSON.parse(response);
        studentArray = [];
        studentArray = studentArr;
        var $dropdown = $("#childName");
        $dropdown.empty();
        $dropdown.append($("<option />").val("").text("Please select a name:"));
        $.each(studentArr, function () {
          $dropdown.append(
            $("<option />").val(this.rowid).text(this.StudentName)
          );
        });
      }
    );
  }
}

function changedName() {
  //If something has been selected, remove student name errors.
  if ($("#childName option:selected").val()) hideChildNameError();

  //Find the child from the childArray.
  var studentIndex = findWithAttr(
    studentArray,
    "rowid",
    parseInt($("#childName option:selected").val())
  );
  if (studentIndex > -1) {
    var studentObj = studentArray[studentIndex];
    selectedStudent = studentObj;

    //Set the buttons disabled / enabled based on whether or not the
    //student are allowed to perform those operations.
    $("#multiplicationButton").prop(
      "disabled",
      studentObj.MultiplicationZeroToTwelve ? false : true
    );
    $("#multiplicationButton2").prop(
      "disabled",
      studentObj.MultiplicationZeroToFive ? false : true
    );
    $("#additionButton").prop(
      "disabled",
      studentObj.AdditionZeroToTen ? false : true
    );

    //Pick their default operation
    switch (studentObj.DefaultOperation) {
      case 0:
        clickMultiplicationOperation();
        break;
      case 1:
        clickMultiplicationOperation2();
        break;
      case 2:
        clickAdditionOperation();
        break;
      default:
        break;
    }
  }
  //Couldn't find the student (or the array is empty). Disable the buttons.
  else {
    $("#multiplicationButton").prop("disabled", true);
    $("#multiplicationButton2").prop("disabled", true);
    $("#additionButton").prop("disabled", true);
    selectedStudent = {};
  }
}

function submitData() {
  var operationText = "";
  if (selectedOperation == "Multiplication")
    operationText = "Multiplication (0 - 12)";
  else if (selectedOperation == "Multiplication2")
    operationText = "Multiplication (0 - 5)";
  else if (selectedOperation == "Addition") operationText = "Addition (0 - 10)";

  var className = $("#className option:selected").text();

  var jsonObj = {
    studentName: $("#childName option:selected").text(),
    class: className,
    correctQuestions: correctCount,
    questionsAnswered: correctCount + incorrectCount,
    timeElapsed: document.getElementById("timeGrid").innerHTML,
    operation: operationText,
    teacherName: $("#teacher option:selected").text(),
    smartScore: document.getElementById("smartScore").innerHTML,
    studentId: $("#childName option:selected").val(),
    teacherId: $("#teacher option:selected").val(),
    classId: $("#className option:selected").val(),
  };

  $.post("/saveData", jsonObj, function (response) {
    buildChart();
  });
}

function showClassNameError() {
  $("#classNameError").css("display", "block");
  $("#className").addClass("errorShadow");
}

function showChildNameError() {
  $("#childNameError").css("display", "block");
  $("#childName").addClass("errorShadow");
}

function hideClassNameError() {
  $("#classNameError").css("display", "none");
  $("#className").removeClass("errorShadow");
}

function hideChildNameError() {
  $("#childNameError").css("display", "none");
  $("#childName").removeClass("errorShadow");
}

function clickMultiplicationOperation() {
  selectedOperation = "Multiplication";
  document
    .getElementById("multiplicationButton")
    .classList.remove("inactive-button");
  document.getElementById("additionButton").classList.add("inactive-button");
  document
    .getElementById("multiplicationButton2")
    .classList.add("inactive-button");
}

function clickMultiplicationOperation2() {
  selectedOperation = "Multiplication2";
  document
    .getElementById("multiplicationButton2")
    .classList.remove("inactive-button");
  document
    .getElementById("multiplicationButton")
    .classList.add("inactive-button");
  document.getElementById("additionButton").classList.add("inactive-button");
}

function clickAdditionOperation() {
  selectedOperation = "Addition";
  document
    .getElementById("multiplicationButton")
    .classList.add("inactive-button");
  document.getElementById("additionButton").classList.remove("inactive-button");
  document
    .getElementById("multiplicationButton2")
    .classList.add("inactive-button");
}

function changedTeacher() {
  selectedTeacher = $("#teacher option:selected").text();
  changedClass();

  $("#className").empty();
  $("#className").append($("<option />").text("Loading..."));

  //Populate the class dropdown based on the first result.
  $.post(
    "getClassesByTeacherId",
    { teacherId: $("#teacher option:selected").val() },
    function (response) {
      var classArr = JSON.parse(response);
      var $dropdown = $("#className");
      $dropdown.empty();
      $dropdown.append($("<option />").val("").text("Please select a class:"));
      $.each(classArr, function () {
        $dropdown.append($("<option />").val(this.rowid).text(this.ClassName));
      });
    }
  );
}

function hideClassSettings() {
  showClassSettingsFlag = false;
  //clickMultiplicationOperation();
  $("#multiplicationButton").prop("disabled", false);
  $("#multiplicationButton2").prop("disabled", false);
  $("#additionButton").prop("disabled", false);
  $("#quickStart").removeClass("inactive-button");
  $("#chooseAClass").addClass("inactive-button");
  $("#classSettings").hide();
  $("#teacherSettings").hide();
  $("#childSettings").hide();
  hideClassNameError();
  hideChildNameError();
}

function showClassSettings() {
  showClassSettingsFlag = true;
  $("#chooseAClass").removeClass("inactive-button");
  $("#quickStart").addClass("inactive-button");
  $("#classSettings").show();
  $("#teacherSettings").show();
  $("#childSettings").show();
}

function buildChart() {
  //Get the student's previous data for the month
  $.post(
    "/resultsByStudentId",
    {
      teacherId: $("#teacher option:selected").val(),
      studentId: $("#childName option:selected").val(),
      startDate: firstDayOfMonth.toISOString().split("T")[0],
      endDate: lastDayOfMonth.toISOString().split("T")[0],
    },
    function (response) {
      var resultsArray = JSON.parse(response);

      var yArr = [];
      var xArr = [];
      var textArr = [];
      var colorArr = [];
      var studentName = $("#childName option:selected").text();

      for (var i = resultsArray.length - 1; i >= 0; i--) {
        var obj = resultsArray[i];

        var date = new Date(obj.DateTime + " UTC");
        var hours = date.getHours();
        var dateString =
          date.getMonth() +
          1 +
          "/" +
          date.getDate() +
          "<br>" +
          (hours % 12 ? hours % 12 : 12) +
          ":" +
          (date.getMinutes() < 10
            ? "0" + date.getMinutes()
            : date.getMinutes()) +
          (hours >= 12 ? "PM" : "AM");

        xArr.push(dateString);
        yArr.push(obj.SmartScore || 0);
        textArr.push(obj.SmartScore || 0);
        colorArr.push(i == 0 ? "#82c91e" : "royalblue");
      }

      var data = [
        {
          y: yArr,
          x: xArr,
          type: "bar",
          marker: {
            color: colorArr,
          },
          text: textArr,
        },
      ];

      var layout = {
        title: {
          text:
            monthNames[firstDayOfMonth.getMonth()] +
            " " +
            firstDayOfMonth.getFullYear() +
            " - " +
            studentName +
            "'s Smart Scores",
          font: {
            family: "Lato, sans-serif",
            size: 24,
          },
        },
        height: 700,
        paper_bgcolor: "#4169E100",
        xaxis: {
          type: "category",
          title: {
            text: "Attempt",
            font: {
              family: "Lato, sans-serif",
              size: 18,
            },
          },
          font: {
            family: "Lato, sans-serif",
            size: 18,
          },
        },
        yaxis: {
          title: {
            text: "Smart Score",
            font: {
              family: "Lato, sans-serif",
              size: 18,
            },
          },
          range: [0, 100],
        },
      };

      Plotly.newPlot("gd", data, layout, {
        displayModeBar: false,
        staticPlot: true,
        responsive: true
      });
    }
  );
}

function toggleKofi(){
  $("#kofi").toggle();
}

function openSideNav(){
  $("#sideNav").width("min(600px, 70vw)");
}

function closeSideNav(){
  $("#sideNav").width(0);
}

function toggleReadMore(id){
  if ($(".news #" + id + " .moreText").css("display") == "none"){
     $(".news #" + id + " .moreText").css("display", "block"); 
    $(".news #" + id + " .readMore").html("Read Less");
  }
  else{
    $(".news #" + id + " .moreText").css("display", "none");
    $(".news #" + id + " .readMore").html("Read More");
  }
}

function navigate(url){
  switch(url){
    case 'home':
      window.location.href = "/";
      break;
    case 'news':
      window.location.href = "/news";
      break;
    default:
      window.location.href = "/";
      break;
  }
}

//Helper function - find with attribute
function findWithAttr(array, attr, value) {
  for (var i = 0; i < array.length; i += 1) {
    if (array[i][attr] === value) {
      return i;
    }
  }
  return -1;
}
