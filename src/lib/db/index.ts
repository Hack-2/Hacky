import env from '../../../env.json';
import mongoose from 'mongoose';

import { Module } from '@ilefa/ivy';

const URI = `mongodb+srv://${env.mongo.username}:${env.mongo.password}@${env.mongo.host}/${env.mongo.dbName}`;

export class MongoDbManager extends Module {

    constructor() {
        super('MongoDB');
    }

    async start() {
        await mongoose.connect(URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .then(_ => this.manager.engine.logger.info('Mongo', 'Connected to the MongoDB!'))
        .catch(err => this.manager.engine.logger.except(err, 'Mongo', 'Failed to connect to the MongoDB'));
    }

    end() {}

}