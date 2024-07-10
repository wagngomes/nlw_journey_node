import fastify from 'fastify'
import { createTrip } from './routes/create-trips'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { confirmTrip } from './routes/confirm-trip'
import cors from '@fastify/cors'
import { confirmPaticipants } from './routes/confirm-participant'
import { createActivity } from './routes/create-activity'
import { getActivities } from './routes/get-activities'
import { createLink } from './routes/create-link'
import { getLinks } from './routes/get-links'


const app = fastify()

app.register(cors, {
    origin: true
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(createTrip)
app.register(confirmTrip)
app.register(confirmPaticipants)
app.register(createActivity)
app.register(getActivities)
app.register(createLink)
app.register(getLinks)

app.listen({port: 3333}).then(() => {
    console.log('server unning')

})