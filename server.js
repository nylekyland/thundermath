var express = require("express");
var passport = require("passport");
var bodyParser = require("body-parser");
var session = require("express-session");
var GoogleStrategy = require("passport-google-oauth20").Strategy;

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

//Configure session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true,
  })
);

//Use passport
//app.use(passport.initialize());
//app.use(passport.session());

/*
passport.serializeUser((user, done) => {
  // Store the userId in the session so we can retrieve it later
  done(null, user.EmailAddress);
});

passport.deserializeUser((emailAddress, done) => {
  // Find user in database by stored session userId
  var sqlToRun =
    "SELECT * FROM Users WHERE EmailAddress = ? AND Deleted = 0 LIMIT 1";
  db.all(sqlToRun, [emailAddress], function (err, rows) {
    if (err) return done("User not found");
    else return done(null, rows[0]);
  });
});

// Register all passport strategies
// Use Google oauth2 strategy

var callbackURL =
  "https://enormous-cobalt-emmental.glitch.me/auth/google/callback";
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL,
    },
    (accessToken, refreshToken, data, done) => {
      // Find user email in database
      var sqlToRun =
        "SELECT * FROM Users WHERE EmailAddress = ? AND Deleted = 0 LIMIT 1";
      db.all(sqlToRun, [data._json.email], function (err, rows) {
        if (err) return done();
        else if (rows.length == 0) {
          console.log("no user found for that email address");
          return done();
        } else {
          return done(null, rows[0]);
        }
      });
    }
  )
);
*/

// init sqlite db
var fs = require("fs");
var dbFile = "./.data/sqlite.db";
var exists = fs.existsSync(dbFile);
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(dbFile);

/*
// Consent screen
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Authorized redirect (defined in Google Developer Console)
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to the app.
    res.redirect("/");
  }
);

app.get("/login", (req, res) => {
  if (req.user) {
    res.redirect("/");
  } else {
    res.sendFile(__dirname + "/src/pages/login.html");
  }
});

app.get("/logout", (request, response) => {
  request.session.destroy(function (e) {
    request.logout();
    request.user = null;
    response.redirect("/");
  });
});
*/

app.get("/", function (request, response) {
  /*
  if (request.user) {
    response.sendFile(__dirname + "/src/pages/index.html");
  } else response.redirect("/login");
  */
  response.sendFile(__dirname + "/src/pages/index.html");
});

app.get("/admin", function (request, response) {
  /*
  if (request.user) response.sendFile(__dirname + "/src/pages/admin.html");
  else response.redirect("/login");
  */
  response.sendFile(__dirname + "/src/pages/admin.html");
});

app.get("/news", function (request, response){
  response.sendFile(__dirname + "/src/pages/news.html");
});

db.serialize(function () {
  if (!exists) {
    db.run(
      "CREATE TABLE Data (DateTime DATETIME, StudentName TEXT, Class TEXT, CorrectQuestions INT, QuestionsAnswered INT, TimeElapsed TEXT, Operation TEXT, TeacherName TEXT, SmartScore INT, StudentId INT, TeacherId INT, ClassId INT)"
    );
    console.log("New table Data created!");
  } else {
    console.log('Database "Data" ready to go!');
  }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/saveData", function (request, response) {
  console.log("inserting new data...");
  console.log(request.body);
  var sqlToRun =
    "INSERT INTO Data (DateTime, StudentName, Class, CorrectQuestions, QuestionsAnswered, TimeElapsed, Operation, TeacherName, SmartScore, StudentId, TeacherId, ClassId) VALUES (CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  db.run(
    sqlToRun,
    [
      request.body.studentName,
      request.body.class,
      request.body.correctQuestions,
      request.body.questionsAnswered,
      request.body.timeElapsed,
      request.body.operation,
      request.body.teacherName,
      request.body.smartScore,
      request.body.studentId,
      request.body.teacherId,
      request.body.classId,
    ],
    (error) => {
      if (error) console.log("error inserting!: " + error);
      else response.send("success!");
    }
  );
});

app.use("/results", function (request, response) {
  var sqlToRun =
    "SELECT ROWID, MAX(DateTime) AS DateTime, StudentName, Class, CorrectQuestions, QuestionsAnswered, TimeElapsed, "+
    "Operation, TeacherName, SmartScore, StudentId, TeacherId, ClassId "+
     "FROM Data WHERE TeacherId = ? AND ClassId = ? GROUP BY StudentId ORDER BY StudentId ASC";
  db.all(sqlToRun, [request.body.teacherId, request.body.classId], function (err, rows) {
    if (err) response.send(err);
    else response.send(JSON.stringify(rows));
  });
});

app.use("/resultsByStudentId", function (request, response) {
  if (request.body && request.body.studentId && request.body.teacherId) {
    var sqlToRun =
      "SELECT ROWID, * FROM Data WHERE TeacherId = ? AND StudentId = ? AND " +
      "DateTime >= ? AND DateTime < ? ORDER BY DateTime DESC";
    db.all(
      sqlToRun,
      [request.body.teacherId, request.body.studentId, request.body.startDate, request.body.endDate],
      function (err, rows) {
        if (err) response.send(err);
        else response.send(JSON.stringify(rows));
      }
    );
  } else {
    response.send("Error: /resultsByStudentId");
  }
});

app.use("/resultsByClassId", function (request, response) {
  if (request.body && request.body.classId && request.body.teacherId) {
    var sqlToRun =
      "SELECT ROWID, * FROM Data WHERE TeacherId = ? AND ClassId = ? ORDER BY DateTime DESC";
    db.all(
      sqlToRun,
      [request.body.teacherId, request.body.classId],
      function (err, rows) {
        if (err) response.send(err);
        else response.send(JSON.stringify(rows));
      }
    );
  } else {
    response.send("Error: /resultsByClassId");
  }
});

app.use("/passwordCheck", function (request, response) {
  //Compare request password with environment secret password.
  if (
    request.body.password &&
    request.body.password == process.env.ADMIN_PASSWORD
  )
    response.send("1");
  else if (
    request.body.password &&
    request.body.password == process.env.ADMIN_PASSWORD2
  ) {
    response.send("2");
  } else if (
    request.body.password &&
    request.body.password == process.env.ADMIN_PASSWORD3
  ) {
    response.send("3");
  } else response.send("failure");
});

app.use("/getTeachers", function (request, response) {
  //Get all teachers that have not been deleted.
  var sqlToRun =
    "SELECT ROWID, * FROM Teachers WHERE DELETED = 0 ORDER BY SortOrder, TeacherName";
  db.all(sqlToRun, function (err, rows) {
    if (err) response.send(err);
    else response.send(JSON.stringify(rows));
  });
});

app.use("/getClassesByTeacherId", function (request, response) {
  if (request.body.teacherId) {
    var sqlToRun =
      "SELECT ROWID, * FROM Classes WHERE DELETED = 0 AND TeacherId = ? ORDER BY SortOrder";
    db.all(sqlToRun, [request.body.teacherId], function (err, rows) {
      if (err) response.send(err);
      else response.send(JSON.stringify(rows));
    });
  } else {
    response.send("Error: /getClassesByTeacherId");
  }
});

app.use("/getStudentsByClassId", function (request, response) {
  if (request.body.classId) {
    var sqlToRun =
      "SELECT ROWID, * FROM Students WHERE Deleted = 0 AND ClassId = ?";
    db.all(sqlToRun, [request.body.classId], function (err, rows) {
      if (err) response.send(err);
      else response.send(JSON.stringify(rows));
    });
  } else {
    response.send("Error: /getStudentsByClassId");
  }
});

var listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
