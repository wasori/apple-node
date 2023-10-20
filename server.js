// express 라이브러리를 사용하겠다는 뜻
const express = require('express')
const app = express()
const methodOverride = require('method-override')
const bcrypt = require('bcrypt')

app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))

// passport 세팅
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const MongoStore = require('connect-mongo')

app.use(passport.initialize())
app.use(session({
    secret: '암호화에 쓸 비번',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60 * 60 * 1000
    },
    store : MongoStore.create({
        mongoUrl : 'mongodb+srv://admin:qwer1234@cluster0.pakrwo1.mongodb.net/?retryWrites=true&w=majority',
        dbName : 'forum'
    })
}))

app.use(passport.session())


// MongoDB 라이브러리 사용관련
const {
    MongoClient,
    ObjectId
} = require('mongodb')

let db
const url = 'mongodb+srv://admin:qwer1234@cluster0.pakrwo1.mongodb.net/?retryWrites=true&w=majority'
new MongoClient(url).connect().then((client) => {
    console.log('DB연결성공')
    db = client.db('forum')
    // 서버 띄우는 코드임
    app.listen(8080, () => {
        console.log('http://localhost:8080 에서 서버 실행중')
    })
}).catch((err) => {
    console.log(err)
})

// 간단한 서버 기능임
// 메인페이지 접속시 '반갑다' 보내주셈
app.get('/', (요청, 응답) => {
    응답.sendFile(__dirname + '/index.html')
})

app.get('/about', (요청, 응답) => {
    응답.sendFile(__dirname + '/profile.html')
})

app.get('/news', (요청, 응답) => {
    응답.send('오늘 비옴');
})

app.get('/shop', (요청, 응답) => {
    응답.send('쇼핑 페이지임!!!');
})

app.get('/list', async (요청, 응답) => {
    let result = await db.collection('post').find().toArray();
    응답.render('list.ejs', {
        posts: result
    })
})

app.get('/time', (요청, 응답) => {
    응답.render('time.ejs', {
        time: new Date()
    })
})

app.get('/write', (요청, 응답) => {
    응답.render('write.ejs');
})

app.post('/add', async (요청, 응답) => {
    console.log(요청.body);

    try {
        if (요청.body.title == '') {
            응답.send('제목 입력안했는데?');
        } else {
            await db.collection('post').insertOne({
                title: 요청.body.title,
                content: 요청.body.content
            })
            응답.redirect('/list');
        }
    } catch (e) {
        console.log(e);
        응답.status(500).send('서버에러남');
    }
})

app.get('/detail/:id', async (요청, 응답) => {
    try {
        let result = await db.collection('post').findOne({
            _id: new ObjectId(요청.params.id)
        });
        if (result == null) {
            응답.status(404).send('이상한 url 입력함');
        }
        응답.render('detail.ejs', {
            result: result
        });
    } catch (e) {
        console.log(e);
        응답.status(404).send('이상한 url 입력함');
    }

})

app.get('/edit/:id', async (요청, 응답) => {
    let result = await db.collection('post').findOne({
        _id: new ObjectId(요청.params.id)
    });
    응답.render('edit.ejs', {
        result: result
    });
})

app.put('/edit', async (요청, 응답) => {
    // await db.collection('post').updateMany({
    //     like : {$gt : 10} 
    // }, {
    //     $inc: {
    //         like : 1
    //     }
    // });
    await db.collection('post').updateOne({
        _id: new ObjectId(요청.body.id)
    }, {
        $set: {
            title: 요청.body.title,
            content: 요청.body.content
        }
    });
    console.log();
    응답.redirect('/list');
})


app.delete('/delete', async (요청, 응답) => {
    console.log(요청.query)
    await db.collection('post').deleteOne({
        _id: new ObjectId(요청.query.docid)
    })
    응답.send('삭제완료');
})

app.get('/list/:id', async (요청, 응답) => {
    // 6번부터 10번글을 찾아서 result변수에 저장
    let result = await db.collection('post').find().skip((요청.params.id - 1) * 5).limit(5).toArray();
    응답.render('list.ejs', {
        posts: result
    })
})

app.get('/list/next/:id', async (요청, 응답) => {
    // 6번부터 10번글을 찾아서 result변수에 저장
    let result = await db.collection('post').find({
        _id: {
            $gt: new ObjectId(요청.params.id)
        }
    }).limit(5).toArray();
    응답.render('list.ejs', {
        posts: result
    })
})


passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
    let result = await db.collection('user').findOne({ username : 입력한아이디})
    if (!result) {
      return cb(null, false, { message: '아이디 DB에 없음' })
    }
  
    if (await bcrypt.compare(입력한비번, result.password)) {
      return cb(null, result)
    } else {
      return cb(null, false, { message: '비번불일치' });
    }
  })) 

passport.serializeUser((user, done) => {
    process.nextTick(() => {
        done(null, {
            id: user._id,
            username: user.username
        })
    })
})

passport.deserializeUser(async (user, done) => {
    let result = await db.collection('user').findOne({
        _id: new ObjectId(user.id)
    })
    delete result.password;
    process.nextTick(() => {
        done(null, result)
    })
})

app.get('/login', async (요청, 응답) => {
    응답.render('login.ejs')
})

app.post('/login', async (요청, 응답, next) => {
    passport.authenticate('local', (error, user, info) => {
        if (error) return 응답.status(500).json(error);
        if (!user) return 응답.status(401).json(info.message);
        요청.logIn(user, (err) => {
            if (err) return next(err);
            응답.redirect("/list/1")
        })
    })(요청, 응답, next)

})

app.get('/register', (요청, 응답) => {
    응답.render('register.ejs');
})

app.post('/register', async (요청, 응답) => {
    let hash = await bcrypt.hash(요청.body.password, 10)

    await db.collection('user').insertOne({
        username: 요청.body.username,
        password: hash
    })
    응답.redirect('/')
})