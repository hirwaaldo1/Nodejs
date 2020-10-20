require("dotenv").config();
const UserSchame = require("../model/user");
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const {
  createRefreshToken,
  createAccessToken,
  sendAccessToken,
  sendRefreshToken,
} = require("../scr/token");
const { isAuth } = require("../scr/auth");
const { verify } = require("jsonwebtoken");
router.post("/signup", (req, res) => {
  const { body } = req;
  const { username, password } = body;
  let { email } = body;
  if (!username) {
    return res.send({
      success: false,
      messages: "Username is Missing",
    });
  }
  if (!email) {
    return res.send({
      success: false,
      messages: "Email is Missing",
    });
  }
  if (!password) {
    return res.send({
      success: false,
      messages: "Password is Missing",
    });
  }
  if (password.length < 8) {
    return res.send({
      success: false,
      messages: "increase the password",
    });
  }
  email = email.toLowerCase();
  console.log(`email: ${email} username: ${username} password:${password} `);
  UserSchame.find(
    {
      email: email,
    },
    (err, prevUser) => {
      if (err) {
        return res.send({
          success: false,
          messages: "Servers errors",
        });
      } else if (prevUser.length > 0) {
        return res.send({
          success: false,
          messages: "Account already exits",
        });
      }
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: "hirwaaldo1@gmail.com",
          pass: process.env.ACCESS_EMAIL_PASSWORD,
        },
      });
      let text = `Hi ${username} <br/> Thank You for SingUp to Talk.com <br/>`;
      var mailOptions = {
        from: "hirwaaldo1@gmail.com",
        to: email,
        subject: "Sending Email using Node.js",
        html: text,
      };
      transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
          console.log(err);
          return res.send({
            success: false,
            messages: "Email does not exits",
          });
        } else {
          console.log(info);
          const newUser = new UserSchame();
          newUser.username = username;
          newUser.email = email;
          newUser.password = password;
          newUser.save((err, data) => {
            if (err) {
              return res.send({
                success: false,
                messages: "Servers errors",
              });
            }
            return res.send({
              success: true,
              messages: "Sign up sucsess",
            });
          });
        }
      });
    }
  );
});
router.post("/refresh_token", (req, res) => {
  const token = req.cookies.refreshtoken;
  console.log(token);
  if (!token) return res.send({ accesstoken: `${token}` });
  let payload = null;
  try {
    payload = verify(token, "REFRESH_TOKEN_SECRET");
  } catch (error) {
    return res.send({ accesstoken: "l" });
  }
  const user = User.find((user) => user.id === payload.userId);
  if (!user) return res.send({ accesstoken: "7" });
  if (user.refreshtoken !== token) {
    return res.send({ accesstoken: "a" });
  }
  const accesstoken = createAccessToken(user.id);
  const refreshtoken = createRefreshToken(user.id);
  user.refreshtoken = refreshtoken;
  sendRefreshToken(res, refreshtoken);
  return res.send({ accesstoken });
});
router.post("/logout", (_req, res, next) => {
  res.clearCookie("refreshtoken", { path: "/refresh_token" });
  return res.send({
    messange: "logout ",
  });
});
router.post("/protected", async (req, res) => {
  try {
    const userId = isAuth(req);
    if (userId !== null) {
      res.send({ data: "this is protected data" });
    }
  } catch (error) {
    res.send({ error: `${error}` });
  }
});
router.post("/signin", (req, res) => {
  const { body } = req;
  const { password } = body;
  let { email } = body;
  if (!email) {
    return res.send({
      success: false,
      messages: "Email is Missing",
    });
  }
  if (!password) {
    return res.send({
      success: false,
      messages: "Password is Missing",
    });
  }
  UserSchame.find({ email: email }, (err, data) => {
    if (err) {
      return res.send({
        success: false,
        messages: "Server errors",
      });
    }
    if (data.length != 1) {
      return res.send({
        success: false,
        messages: "user does not exits",
      });
    }
    const user = data[0];
    if (!user.password) {
      return res.send({
        success: false,
        messages: "user does not exits",
      });
    }

    const accesstoken = createAccessToken(user.id);
    const refreshtoken = createRefreshToken(user.id);
    sendRefreshToken(res, refreshtoken);
    sendAccessToken(res, req, accesstoken);
  });
});
router.get("/login/:id", (req, res) => {
  UserSchame.findById(req.params.id)
    .then((user) => res.json(user))
    .catch((err) => {
      res.status(400).json("errror" + err);
    });
});
router.get("/login", (req, res) => {
  UserSchame.find(req.param.id)
    .then((users) => res.json(users))
    .catch((err) => res.status(400).json("eroor" + err));
});
router.post("/forget", (req, res) => {
  const { body } = req;
  let { email } = body;
  if (!email) {
    return res.send({
      success: false,
      messages: "Email is Missing",
    });
  }
  email = email.toLowerCase();
  UserSchame.find(
    {
      email: email,
    },
    (err, prevUser) => {
      if (err) {
        return res.send({
          success: false,
          messages: "Servers errors",
        });
      } else if (prevUser.length > 0) {
        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "hirwaaldo1@gmail.com",
            pass: process.env.ACCESS_EMAIL_PASSWORD,
          },
        });
        let text = `Hi ${prevUser[0].username} <br/> Your password on Talk.com <b><u>${prevUser[0].password}</u></b>  <br/>`;
        var mailOptions = {
          from: "hirwaaldo1@gmail.com",
          to: email,
          subject: "Sending Email using Node.js",
          html: text,
        };
        transporter.sendMail(mailOptions, function (err, info) {
          if (err) {
            console.log(err);
            return res.send({
              success: false,
              messages: "Email does not exits",
            });
          } else {
            return res.send({
              success: true,
              messages: "Sign up sucsess",
            });
          }
        });
      } else {
        return res.send({
          success: false,
          messages: "Email does not exits",
        });
      }
    }
  );
});
router.post("/facebookLogin", (req, res) => {
  const { body } = req;
let { username, password } = body;
  let { email } = body;
  if (!username) {
    return res.send({
      success: false,
      messages: "Username is Missing",
    });
  }
  if (!email) {
    return res.send({
      success: false,
      messages: "Email is Missing",
    });
  }
  if (!password) {
    return res.send({
      success: false,
      messages: "Password is Missing",
    });
  }
  email = email.toLowerCase();
  console.log(`email: ${email} username: ${username} password:${password} `);
  UserSchame.find(
    {
      email: email,
    },
    (err, prevUser) => {
      if (err) {
        return res.send({
          success: false,
          messages: "Servers errors",
        });
      } else if (prevUser.length > 0) {
        username= prevUser[0].username
        email=prevUser[0].email
        password=prevUser[0].password
        // res.setHeader('name',  prevUser[0]._id)
        // const accesstokens = createAccessToken( prevUser[0]._id);
        // const refreshtokens = createRefreshToken( prevUser[0]._id);
        // sendRefreshToken(res, refreshtokens);
        // sendAccessToken(res, req, accesstokens);
        return res.send({
          success: false,
          messages: `User exits ${prevUser.username} `,
        })
      }
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: "hirwaaldo1@gmail.com",
          pass: process.env.ACCESS_EMAIL_PASSWORD,
        },
      });
      let text = `Hi Your username ${username} <br/> ,Your Email ${email} And Your Paswword ${password} Thank You for SingUp to Talk.com <br/>`;
      var mailOptions = {
        from: "hirwaaldo1@gmail.com",
        to: email,
        subject: "Sending Email using Node.js",
        html: text,
      };
      transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
          console.log(err);
          return res.send({
            success: false,
            messages: "Email does not exits",
          });
        } else {
          console.log(info);
          const newUser = new UserSchame();
          newUser.username = username;
          newUser.email = email;
          newUser.password = password;
          newUser.save((err, data) => {
            if (err) {
              return res.send({
                success: false,
                messages: "Servers errors",
              });
            }
           
            const accesstoken = createAccessToken(data.id);
            const refreshtoken = createRefreshToken(data.id);
            sendRefreshToken(res, refreshtoken);
            sendAccessToken(res, req, accesstoken);
          });
        }
      });
    }
  );
});
router.post('/data/update/:id',(req,res)=>{
  UserSchame.findById(req.params.id)
  .then(user =>{
  if(!req.body.username){
     user.username===user.username
  }else{
     user.username=req.body.username
  }
  if(!req.body.email){
     user.email===user.email
  }else{
     user.email=req.body.email
  }
  if(!req.body.password){
     user.password===user.password
     user.repassword===user.repassword
  }else{
     user.password=req.body.password
  }
     user.save()
     .then(()=> res.json('user update'))
     .catch(err =>res.status(400).json('error'+err))

  })
  .catch(err =>{res.status(400).json('errror'+err)})
 })
module.exports = router;
