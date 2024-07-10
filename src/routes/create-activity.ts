import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {date, string, z} from 'zod'
import { prisma } from "../lib/prisma";
import dayjs from "dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')
dayjs.extend(localizedFormat)

export async function createActivity(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/activities', {
        schema: {
            params: z.object({
                tripId: string().uuid(),
            }),
            body: z.object({
                title: z.string().min(4),
                occurs_at: z.coerce.date(),

            })
        }
    } ,async(request) => {
        const { tripId } = request.params
        const {title, occurs_at} = request.body


        const trip = await prisma.trip.findUnique({
            where:{
                id: tripId
            }
        })

        if (!trip) {
            throw new Error('Trip not found')
        }
        if (dayjs(occurs_at).isBefore(trip.starts_at)){
            throw new Error('Invalid activity date')
        }
        if (dayjs(occurs_at).isAfter(trip.starts_at)){
            throw new Error('Invalid activity date')
        }

        const activity = await prisma.activity.create({
            data: {
                title,
                occurs_at,
                tripId,

            }
        })



        return {
            activityId: activity.id
        }
    })
}