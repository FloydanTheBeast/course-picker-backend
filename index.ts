import express from 'express'

const PORT = 8000

const app = express()

app.get('/', (_, res) => {
	res.send('Basic Node.js + Express server')
})

app.listen(PORT)
