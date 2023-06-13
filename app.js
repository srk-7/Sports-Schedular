/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const {Admin, Sports, Session, Player, participants } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("ssh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

//views accessible globally
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
const saltRounds = 10;
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
// const participants = require("./models/participants");

app.use(flash());
app.use(
  session({
    secret: "my_super-secret-key-217263018951768",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, //24hrs
    },
  })
);
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  "admin",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Admin.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(null, false, { message: "Email doesn't exist" });
        });
    }
  )
);

passport.use(
  "player",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Player.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(null, false, { message: "Email doesn't exist" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session ", user.id);
  let temp;
  if (Object.getPrototypeOf(user) === Player.prototype) {
    temp = "Player";
  } else if (Object.getPrototypeOf(user) === Admin.prototype) {
    temp = "Admin";
  }
  done(null, { id: user.id, currUser: temp });
});

passport.deserializeUser(async ({ id, currUser }, done) => {
  console.log("Curr User", currUser);
  if (currUser === "Admin") {
    await Admin.findByPk(id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
  } else if (currUser === "Player") {
    await Player.findByPk(id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
  }
});


// passport.serializeUser((user, done) => {
//   console.log("Serilaizing user in session", user.id);
//   done(null, user.id);
// });

// passport.deserializeUser((id, done) => {
//   Admin.findByPk(id)
//     .then((user) => {
//       done(null, user);
//     })
//     .catch((error) => {
//       done(error, null);
//     });
// });


app.set("view engine", "ejs");

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async function (request, response) {
  response.render("index", {
    title: "Sports Schedular Application",
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/sports",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const loggedInUser = request.user.id;
    const UserName = request.user.firstname;
    const sports = await Sports.findAll({
      where:{
        adminid:loggedInUser,
      }
  });
    if (request.accepts("html")) {
      response.render("adminsport", {
        UserName,
        loggedInUser,
        sports,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        UserName,
        loggedInUser,
        sports,
      });
    }
  }
);

app.get(
  "/playersport",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const loggedInUser = request.user.id;
    const UserName = request.user.firstname;
    const sports = await Sports.findAll();
    if (request.accepts("html")) {
      response.render("playersport", {
        UserName,
        loggedInUser,
        sports,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        UserName,
        loggedInUser,
        sports,
      });
    }
  }
);


app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  //creating the user here
  //hash password using bcrypt
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);

  const fname = request.body.firstName;
  console.log("fir1", fname);
  const sname = request.body.lastName;
  const mail = request.body.email;
  const pwd = request.body.password;
  if (!fname) {
    console.log("fir", fname);
    request.flash("error", "Please enter the first Name");
    return response.redirect("/signup");
  }
  if (!sname) {
    request.flash("error", "please enter the second Name");
    return response.redirect("/signup");
  }
  if (!mail) {
    request.flash("error", "please enter your Email id");
  }
  if (!pwd) {
    request.flash("error", "Please enter valid password");
    return response.redirect("/signup");
  }
  if (pwd < 8) {
    request.flash("error", "Password length should be atleast 8");
    return response.redirect("/signup");
  }
  if(request.body.submit=="admin")
  {
    try {
      const user = await Admin.create({
        firstname: request.body.firstName,
        lastname: request.body.lastName,
        email: request.body.email,
        password: hashedPwd,
      });
      console.log(
        "test"
      );
      request.login(user, (err) => {
        if (err) {
          console.log(err);
        } else {
          response.redirect("/sports");
        }
      });
    } catch (error) {
      console.log(error);
      request.flash("success", "Sign up successful");
      request.flash("error", error.message);
      return response.redirect("/signup");
    }
  }
  else
  {
    try {
      const user = await Player.create({
        firstname: request.body.firstName,
        lastname: request.body.lastName,
        email: request.body.email,
        password: hashedPwd,
      });
      console.log(
        "test"
      );
      request.login(user, (err) => {
        if (err) {
          console.log(err);
        } else {
          response.redirect("/playersport");
        }
      });
    } catch (error) {
      console.log(error);
      request.flash("success", "Sign up successful");
      request.flash("error", error.message);
      return response.redirect("/signup");
    }
  }
});

app.get("/login", async (request, response) => {
  response.render("login", {
    title: "Login",
    csrfToken: request.csrfToken(),
  });
});

app.get("/playerlogin", async (request, response) => {
  response.render("playerlogin", {
    title: "Login",
    csrfToken: request.csrfToken(),
  });
});


app.post(
  "/session",
  passport.authenticate("admin", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    //console.log(request.user);
    response.redirect("/sports");
  }
);


app.post(
  "/playersession",
  passport.authenticate("player", {
    failureRedirect: "/palyerlogin",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/playersport");
  }
);

app.get("/signout", (request, response, next) => {
  //sign out code is here
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/"); //redirecting to landing page
  });
});


app.post(
  "/sports",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("Creating a Sport", request.body);
    // console.log(request.user);
    try {
      // eslint-disable-next-line no-unused-vars
      const sport = await Sports.create({
        name: request.body.title,
        adminid: request.user.id, 
      });
      return response.redirect("/sports");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);


app.post(
  "/joinsession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const uid = request.user.id;
      if (Object.getPrototypeOf(request.user) === Player.prototype) 
      {
        const curruser = await Player.findOne({
          where:{
            id:uid,
          }
        });
        
        await participants.create({
          pname:curruser.firstname,
          sessionid:request.params.id,
        })
      } 
      else if (Object.getPrototypeOf(request.user) === Admin.prototype) 
      {
        const curruser = await Admin.findOne({
          where:{
            id:uid,
          }
        });
        await participants.create({
          pname:curruser.firstname,
          sessionid:request.params.id,
        })
      }
      return response.redirect(`/session/${request.params.id}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);


app.get("/sports/:id", async (request, response) => {
  const sport=await Sports.findOne({
    where:{
      id:request.params.id,
    }
  });
  response.render("adminsession", {
    title: "Session",
    sport,
    csrfToken: request.csrfToken(),
  });
});

app.get("/session/:id", async (request, response) => {
  const players=await participants.findAll({
    where:{
      sessionid:request.params.id,
    }
  });
  const session=await Session.findOne({
    where:{
      id:request.params.id,

    }
  })
  const sport = await Sports.findOne({
    where:{
      id:session.sportid,
    }
  })
  response.render("clicksession", {
    title: "Session",
    players,
    sessionid:request.params.id,
    session,
    sport,
    csrfToken: request.csrfToken(),
  });
});




//creating a sport session
app.post(
  "/createsession",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("Creating a Session to the sport", request.body);
    try {
      const players = request.body.playersJoining
      .split(",").map((player) => player.trim());
        const session = await Session.create({
        start: request.body.time,
        place: request.body.venue,
        participants: request.body.playersJoining
        .split(",").map((player) => player.trim()),
        playersrequired: request.body.playersNeeded,
        sportid: request.body.sportid,
      });
      for(var i=0;i<players.length;i++)
      {
        console.log(players[i]);
        await participants.create({
          pname:players[i],
          sessionid:session.id,
        }) 
      }
      return response.redirect(`session/${session.id}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);


app.get(
  "/sports/beforesession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const loggedInUser = request.user.id;
    const UserName = request.user.firstname;
    const session = await Session.findAll({
      where:
      {
        sportid:request.params.id,
      }
    })
    const sport = await Sports.findOne({
      where:{
        adminid:loggedInUser,
        id:request.params.id,
      }
  });
    if (request.accepts("html")) {
      response.render("beforesession", {
        UserName,
        loggedInUser,
        session,
        sport,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        UserName,
        session,
        loggedInUser,
        sport,
      });
    }
  }
);

app.get(
  "/sports/playerbeforesession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const loggedInUser = request.user.id;
    const UserName = request.user.firstname;
    const session = await Session.findAll({
      where:
      {
        sportid:request.params.id,
      }
    })
    const sport = await Sports.findOne({
      where:{
        id:request.params.id,
      }
  });
    if (request.accepts("html")) {
      response.render("beforesession", {
        UserName,
        loggedInUser,
        session,
        sport,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        UserName,
        session,
        loggedInUser,
        sport,
      });
    }
  }
);


app.delete(
  "/sports/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Deleting a Sport with ID: ", request.params.id);
    try {
      await Sports.destroy({
        where:
        {
          id:request.params.id,
          adminid:request.user.id,
        }
      });
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  }
);


module.exports = app;