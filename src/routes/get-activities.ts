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

export async function getActivities(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/activities', {
        schema: {
            params: z.object({
                tripId: string().uuid(),
            })
        }
    } ,async(request) => {
        const { tripId } = request.params


        const trip = await prisma.trip.findUnique({
            where:{
                id: tripId
            },
            include: {
                activities: true
            }
        })

        if (!trip) {
            throw new Error('Trip not found')
        }
        
        const differenceInDaysBetweenTripStartAndEnd = dayjs(trip.ends_at).diff(trip.starts_at, 'days')
        const activities = Array.from({length: differenceInDaysBetweenTripStartAndEnd + 1}).map((_, index) => {
            const date = dayjs(trip.starts_at).add(index, 'days')

            return {
               date: date.toDate(),
               activities: trip.activities.filter(activity => {
                return dayjs(activity.occurs_at).isSame(date, 'day' )
               })
            }
        })

        return {
            activities
        }
    })
}