const jwt = require("jsonwebtoken");
const {httpRequest} = require('../utils/httpRequest');

module.exports = {
  login: async (req, res) => {
    /* msa */
    const postOptionsResident = {
      host: 'stop_bang_auth_DB',
      port: process.env.PORT,
      path: `/db/resident/findById`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    const postOptionsAgent = {
      host: 'stop_bang_auth_DB',
      port: process.env.PORT,
      path: `/db/agent/findById`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    const requestBody = req.body;
    httpRequest(postOptionsResident, requestBody) // resident 회원 정보 먼저 조회
      .then((res) => {
        const body = res.body;
        if(body === null) {
          return httpRequest(postOptionsAgent, requestBody) // resident 회원 정보가 없으면 agent 회원 정보 조회
        } else {
          return res; // 있다면 다음 콜백으로
        }
      })
      .then((response) => {
        const body = response.body[0];
        console.log(body);
        if(body.r_username) { // 정보가 있다면 쿠키 생성
          const token = jwt.sign({userId: body.r_username}, process.env.JWT_SECRET_KEY);
          res.cookie("authToken", token, {
            maxAge: 86400_000,
            httpOnly: true,
          });
          res.cookie("userType", 1, { // 입주민
            maxAge: 86400_000,
            httpOnly: true,
          });
          return res.redirect('/');
        } else if(body.a_username) {
          const token = jwt.sign({userId: body.a_username}, process.env.JWT_SECRET_KEY);
          res.cookie("authToken", token, {
            maxAge: 86400_000,
            httpOnly: true,
          });
          res.cookie("userType", 0, { // 공인중개사
            maxAge: 86400_000,
            httpOnly: true,
          });
          return res.redirect('/');
        } else {
          res.cookie('authToken', null, {
            maxAge: 86400_000,
            httpOnly: true,
          });
          return res.redirect('/auth/login'); // 정보가 없다면 리다이렉트
        }
      });
  },

  logout: async (req, res) => {
    res.clearCookie("userType");
    res.clearCookie("authToken").redirect("/");
  },
}