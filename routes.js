/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const path = require("path");
const { User } = require("./models");
const Courses = require("./models/courses")
var bodyParser = require("body-parser");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStratergy = require("passport-local");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"]));
app.use(flash());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
    session({
        secret: "my-super-secret-key-23458730948391274",
        cookie: {
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(function (request, response, next) {
    response.locals.messages = request.flash();
    next();
});

passport.use(
    new LocalStratergy(
        {
            usernameField: "email",
            passwordField: "password",
        },
        (username, password, done) => {
            User.findOne({ where: { email: username } })
                .then(async function (user) {
                    const result = await bcrypt.compare(password, user.password);
                    if (result) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: "Invalid password" });
                    }
                })
                .catch((error) => {
                    console.log(error);
                    return done(null, false, { message: "Invalid email" });
                });
        }
    )
);

passport.serializeUser((user, done) => {
    console.log("Serializing user in session", user.id);
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findByPk(id)
        .then((user) => {
            done(null, user);
        })
        .catch((error) => {
            done(error, null);
        });
});

//Home Page
app.get("/", (request, response) => {
    response.render("index", {
        title: "Learning Management System",
        csrfToken: request.csrfToken(),
    })
})
app.get("/changepass", (request, response) => {
    response.render("changepass", {
        title: "Learning Management System",
        csrfToken: request.csrfToken(),
    })
})
app.post("/changepass", async (request, response) => {
    const email = request.body.email;
    const newpass = await bcrypt.hash(request.body.newPassword, saltRounds)
    await User.changepass(email, newpass);
    console.log("password Changed!!!")
    response.redirect("/login");
})
app.get("/report", (request, response) => {
    const loggedinuserrole = request.user.role;
    if (loggedinuserrole != "admin") {
        return response.redirect("/unauthorized")
    } else {
        response.render("report", {
            title: "Report",
            csrfToken: request.csrfToken()
        })
    }
})

//Sign-up Page
app.get("/signup", (request, response) => {
    response.render("signup", {
        title: "Sign-up",
        csrfToken: request.csrfToken(),
    })
})

//Sign-out Route
app.get(
    "/signout",
    connectEnsureLogin.ensureLoggedIn(),
    (request, response, next) => {
        request.logout((err) => {
            if (err) return next(err);
            response.redirect("/");
        });
    }
);
app.get("/unauthorized", (request, response) => {
    response.render("Unauthorized", {
        title: "Unauthorized Access",
        csrfToken: request.csrfToken()
    })
})

app.get("/courses/new", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    const loggedinuserrole = request.user.role;
    const coursename = Courses.coursename();
    if (loggedinuserrole != "admin") {
        return response.redirect("/unauthorized")
    } else {
        response.render("new-course", {
            title: "Create Course",
            coursename,
            csrfToken: request.csrfToken()
        })
    }
})

app.post("/courses/new", async (request, response) => {
    const coursename = request.body.coursename;
    await Courses.create({
        coursename
    })
    console.log("Course Created !!!")
    return response.redirect("/courses/new");
})
//Sign-in Page
app.get("/login", (request, response) => {

    response.render("login", {
        title: "Sign-in",
        csrfToken: request.csrfToken()
    });
});

//Dashboard
app.get("/dashboard", connectEnsureLogin.ensureLoggedIn(), (request, response) => {
    response.render("dashboard", {
        csrfToken: request.csrfToken()
    })
})

//Authenticating Session
app.post(
    "/session",
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
    async (request, response) => {
        response.redirect("/dashboard");
    }
);

//Adding Users here !!!
app.post("/users", async (request, response) => {
    const firstName = request.body.firstName;
    const lastName = request.body.lastName;
    const email = request.body.email;
    const password = request.body.password;
    const hashedPwd = password ? await bcrypt.hash(password, saltRounds) : "";
    try {
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPwd,
            role: "normal"
        });
        request.login(user, (err) => {
            if (err) {
                console.log(err);
            }
            response.redirect("/dashboard");
        });
    } catch (err) {
        if (err.name == "SequelizeValidationError") {
            if (!firstName) request.flash("firstName", "User Name cannot be empty");
            if (!email) request.flash("email", "Email cannot be empty");
            if (!password) request.flash("password", "Password cannot be empty");
            response.redirect("/signup");
        } else if (err.name == "SequelizeUniqueConstraintError") {
            request.flash("email", "email is already used");
            response.redirect("/signup");
        } else console.log(err);
    }
});
module.exports = app;