// express 라이브러리를 사용하겠다는 뜻
const express = require('express')
const app = express()

app.use(express.static(__dirname + '/public'))

// MongoDB 라이브러리 사용관련
const {
    MongoClient
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