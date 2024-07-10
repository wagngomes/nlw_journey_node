import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {date, string, z} from 'zod'
import { prisma } from "../lib/prisma";
import dayjs from "dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/pt-br'
import { UNABLE_TO_FIND_POSTINSTALL_TRIGGER__EMPTY_STRING } from "@prisma/client/scripts/postinstall.js";

dayjs.locale('pt-br')
dayjs.extend(localizedFormat)

export async function getLinks(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/links', {
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
                links: true
            }
        })

        if (!trip) {
            throw new Error('Trip not found')
        }


        return {
            links: trip.links
        }
    })
}