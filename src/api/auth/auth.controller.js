const Joi = require('joi');
const Account = require('models/Account');

// 로컬 로그인
exports.localLogin = async (ctx) => {
    // 데이터 검증
    const schema = Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });

    const result = Joi.validate(ctx.request.body, schema);

    if(result.error) {
        ctx.status = 400; // Bad Request
        return;
    }

    const { email, password } = ctx.request.body; 

    let account = null;
    try {
        // 이메일로 계정 찾기
        account = await Account.findByEmail(email);
    } catch (e) {
        ctx.throw(500, e);
    }

    if(!account || !account.validatePassword(password)) {
    // 유저가 존재하지 않거나 || 비밀번호가 일치하지 않으면
        ctx.status = 403; // Forbidden
        return;
    }

    // 토큰 생성
    let token = null;
    try {
        token = await account.generateToken();
    } catch (e) {
        ctx.throw(500, e);
    }

    ctx.cookies.set('access_token', token, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 });
    ctx.body = account.profile;
};

// 이메일 / 아이디 존재유무 확인
exports.exists = async (ctx) => {
    const { key, value } = ctx.params;
    let account = null;

    try {
        // key 에 따라 findByEmail 혹은 findByUsername 을 실행합니다.
        account = await (key === 'email' ? Account.findByEmail(value) : Account.findByUsername(value));    
    } catch (e) {
        ctx.throw(500, e);
    }

    ctx.body = {
        exists: account !== null
    };
};

// 로그아웃
exports.logout = (ctx) => {
    ctx.cookies.set('access_token', null, {
        maxAge: 0, 
        httpOnly: true
    });
    ctx.status = 204;
};

// 현재 로그인된 유저의 정보를 알려줌, user: { _id, profile }
exports.check = (ctx) => {
    const { user } = ctx.request;

    if(!user) {
        ctx.status = 403; // Forbidden
        return;
    }

    console.log(user.profile);

    ctx.body = user.profile;
};

// 이메일 인증
exports.emailVerify = async (ctx) => {
    // 데이터 검증
    const schema = Joi.object().keys({
        email: Joi.string().email().required(),
        key: Joi.string().hex().required()
    });

    const result = Joi.validate(ctx.request.body, schema);

    if(result.error) {
        ctx.status = 400; // Bad Request
        return;
    }

    const { email, key } = ctx.request.body;
    
    let account = null;
    try {
        // 이메일로 유저 인스턴스를 찾음
        account = await Account.findByEmail(email);
    } catch (e) {
        ctx.throw(500, e);
    }

    // key 일치여부 확인
    if(account.email.key_for_verify != key){
        ctx.status = 403; // Forbidden
        return;
    }

    try { // 일치하면 profile.verified 를 true 로 업데이트
        await account.update({ 'profile.verified': true });
    } catch (e) {
        ctx.throw(500, e);
    }

    // 바뀐 profile의 토큰을 다시 생성
    let token = null;
    try {
        account = await Account.findByEmail(email); // 업데이트된 document 가져옴
        token = await account.generateToken();
    } catch (e) {
        ctx.throw(500, e);
    }

    ctx.cookies.set('access_token', token, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 });
    /* ctx.body = account.profile; // 프로필 정보로 응답합니다. */
    /* ctx.body = { verified: true }; */
    ctx.status = 200;
}

/* // 유저 이메일 인증 여부 확인
exports.emailVerified = async (ctx) => {
    const { email } = ctx.params;
    let account = null;

    try {
        account = await Account.findByEmail(email);    
    } catch (e) {
        ctx.throw(500, e);
    }

    ctx.body = {
        verified: account.profile.verified
    };
} */