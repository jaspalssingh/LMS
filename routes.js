/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const path = require("path");
const { User, Courses, Chapter, Pages, Enrolled } = require("./models");
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
app.get("/report", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    const userid = request.user.id;
    const courses = await Courses.findAll();
    let coursescount;
    const getWithPromiseAll = async () => {
        coursescount = await Promise.all(
            courses.map(async (item) => {
                return (await Enrolled.getcount(item.id)).length;
            })
        );
    };
    await getWithPromiseAll();
    response.render("report", {
        title: "Report",
        userid,
        courses,
        coursescount,
        csrfToken: request.csrfToken()
    })
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

app.get("/courses/new", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    const coursename = await Courses.getcoursename();
    response.render("new-course", {
        title: "Create Course",
        coursename,
        csrfToken: request.csrfToken()
    })
})

app.post("/courses/new", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    const coursename = request.body.coursename;
    await Courses.create({
        coursename
    })
    return response.redirect("/courses/new");
})
app.get("/courses/edit/:courseid", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {

    const courseid = request.params.courseid;
    const chapter = await Chapter.getchapter(courseid);
    response.render("new-chapter", {
        title: "Chapter",
        chapter,
        courseid,
        csrfToken: request.csrfToken()
    })

})
app.get("/courses/edit/:courseid/:chapterid", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {

    const courseid = request.params.courseid;
    const chapterid = request.params.chapterid;
    const pages = await Pages.getpagesname(courseid, chapterid);
    response.render("new-page", {
        title: "Pages",
        pages,
        courseid,
        chapterid,
        csrfToken: request.csrfToken()
    })

})
app.post("/create_page/:courseid/:chapterid", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    const pagename = request.body.pagename;
    const pagedescription = request.body.description;
    const courseid = request.params.courseid;
    const chapterid = request.params.chapterid;
    await Pages.create({
        pagename,
        pagedescription,
        courseid,
        chapterid
    })
    const url = "/courses/edit/" + courseid + "/" + chapterid;
    return response.redirect(url);
})
app.post("/create_chapter/:courseid", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    const chaptername = request.body.chapter;
    const chapterdescription = request.body.description;
    const courseid = request.params.courseid
    await Chapter.create({
        chaptername,
        chapterdescription,
        courseid
    })
    const url = "/courses/edit/" + courseid;
    return response.redirect(url);
})

//Sign-in Page
app.get("/login", (request, response) => {
    response.render("login", {
        title: "Sign-in",
        csrfToken: request.csrfToken()
    });
});

app.get("/view-course/:coursename/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    const coursename = request.params.coursename;
    const courseid = request.params.id;
    const userid = request.user.id;
    const enrolledcourses = await Enrolled.getcoursesid();
    const chapter = await Chapter.getchapter(courseid);

    response.render("view-course", {
        title: "View Course",
        coursename,
        courseid,
        userid,
        chapter,
        enrolledcourses,
        csrfToken: request.csrfToken()
    })
})
app.get("/view-page/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    const chapterid = request.params.id;
    const pages = await Pages.getpages(chapterid)
    response.render("view-page", {
        title: "View Page",
        pages,
        csrfToken: request.csrfToken()
    })
})
//Dashboard
app.get("/dashboard", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    const coursename = await Courses.getcoursename();
    const enrolledcourses = await Enrolled.getenrolledcourses(request.user.id);
    const userrole = request.user.role;
    const userid = request.user.id;
    let enrolledcoursesname;
    const getWithPromiseAll = async () => {
        enrolledcoursesname = await Promise.all(
            enrolledcourses.map(async (item) => {
                return await Courses.findOne({ where: { id: item.courseid } });
            })
        );
    };
    await getWithPromiseAll();

    response.render("dashboard", {
        title: "Dashboard",
        coursename,
        userrole,
        userid,
        enrolledcourses,
        enrolledcoursesname,
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
app.post("/enroll/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    const userid = request.user.id;
    const courseid = request.params.id;
    console.log(userid, courseid);
    await Enrolled.create({
        courseid,
        userid
    }
    )
    response.redirect("/dashboard");
})
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
            role: "admin"
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

app.delete(
    "/delete_course/:id",
    connectEnsureLogin.ensureLoggedIn(),
    async function (request, response) {
        const courseid = request.params.id;
        try {
            await Courses.remove(courseid);
            await Chapter.remove(courseid);
            await Pages.remove(courseid);
            await Enrolled.remove(courseid);
            response.redirect("/courses/new")
        } catch (error) {
            return response.status(422).json(error);
        }
    }
);
app.delete(
    "/delete_chapter/:chapterid",
    connectEnsureLogin.ensureLoggedIn(),
    async function (request, response) {
        const chapterid = request.params.chapterid;
        try {
            await Chapter.remove_chapter(chapterid);
            await Pages.remove_from_chapter(chapterid);
            let url = "/courses/edit/" + chapterid;
            response.redirect(url)
        } catch (error) {
            return response.status(422).json(error);
        }
    }
);
app.delete(
    "/delete_page/:pageid",
    connectEnsureLogin.ensureLoggedIn(),
    async function (request, response) {
        const pageid = request.params.pageid;
        try {
            await Pages.remove_from_page(pageid);
        } catch (error) {
            return response.status(422).json(error);
        }
    }
);
app.delete("/delete_enroll/:courseid",
    connectEnsureLogin.ensureLoggedIn(),
    async function (request, response) {
        const userid = request.user.id;
        const courseid = request.params.courseid;
        console.log(courseid, userid)
        try {

            await Enrolled.remove_enroll(userid, courseid);
        } catch (error) {
            return response.status(422).json(error);
        }
    });
module.exports = app;