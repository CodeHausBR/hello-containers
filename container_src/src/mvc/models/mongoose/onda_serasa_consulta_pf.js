import mongoose from "mongoose";
const Schema = mongoose.Schema;
// HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//DATABASE
import onda_errors from "../public/onda_errors.js";

class onda_serasa_consulta_pf {
    constructor() {
        const addressSchema = new mongoose.Schema({
            addressLine: {type: String, default: null},
            addressTypeCode: {type: Number, default: null},
            addressTypeDescription: {type: String, default: null},
            addressNumber: {type: String, default: null},
            district: {type: String, default: null},
            zipCode: {type: String, default: null},
            country: {type: String, default: null},
            city: {type: String, default: null},
            state: {type: String, default: null},
            addressComplement: {type: String, default: null},
            updateDate: {type: String, default: null},
        });

        const phoneSchema = new mongoose.Schema({
            regionCode: {type: Number, default: null},
            areaCode: {type: Number, default: null},
            phoneNumber: {type: Number, default: null},
            phoneType: {type: String, default: null},
            phoneTypeCode: {type: Number, default: null},
            updateDate: {type: String, default: null},
        });

        const registrationSchema = new mongoose.Schema({
            documentNumber: {type: String, default: null},
            consumerName: {type: String, default: null},
            motherName: {type: String, default: null},
            consumerGender: {type: String, default: null},
            birthDate: {type: String, default: null},
            statusRegistration: {type: String, default: null},
            statusDate: {type: String, default: null},
            consumerGenderDescription: {type: String, default: null},
            address: {
                addressLine: {type: String, default: null},
                district: {type: String, default: null},
                zipCode: {type: String, default: null},
                country: {type: String, default: null},
                city: {type: String, default: null},
                state: {type: String, default: null},
            },
            addresses: [addressSchema],
            phones: [phoneSchema],
        });
        /////
        const pefinResponseItemSchema = new mongoose.Schema({
            occurrenceDate: {type: String, default: null},
            legalNatureId: {type: String, default: null},
            legalNature: {type: String, default: null},
            contractId: {type: String, default: null},
            creditorName: {type: String, default: null},
            amount: {type: Number, default: null},
            principal: {type: Boolean, default: null},
            legalSquare: {type: String, default: null},
            dispute: {
                disputeIndicativeFlag: {type: Boolean, default: null},
            },
            cadus: {type: String, default: null},
        });

        const negativeSummarySchema = new mongoose.Schema({
            count: {type: Number, default: 0},
            balance: {type: Number, default: 0.0},
            firstOccurrence: {type: String, default: null},
            lastOccurrence: {type: String, default: null},
        });

        const genericSummarySchema = new mongoose.Schema({
            count: {type: Number, default: 0},
            balance: {type: Number, default: 0.0},
        });

        /////

        const pefinResponseSchema = new mongoose.Schema({}, {strict: false});
        const refinResponseSchema = new mongoose.Schema({}, {strict: false});
        const notaryResponseSchema = new mongoose.Schema({}, {strict: false});
        const checkResponseSchema = new mongoose.Schema({}, {strict: false});
        const collectionRecordsResponseSchema = new mongoose.Schema({}, {strict: false});

        const summarySchema = new mongoose.Schema({
            count: {type: Number, default: 0},
            balance: {type: Number, default: 0.0},
        });

        const pefinSchema = new mongoose.Schema({
            // pefinResponse: [pefinResponseSchema],
            // summary: {type: summarySchema, default: null},
            pefinResponse: [pefinResponseItemSchema],
            summary: {type: negativeSummarySchema, default: null},
        });

        const refinSchema = new mongoose.Schema({
            // refinResponse: [refinResponseSchema],
            // summary: {type: summarySchema, default: null},
            refinResponse: [{type: mongoose.Schema.Types.Mixed}], // Manter como Mixed se não houver estrutura definida
            summary: {type: genericSummarySchema, default: null},
        });

        const notarySchema = new mongoose.Schema({
            // notaryResponse: [notaryResponseSchema],
            // summary: {type: summarySchema, default: null},
            notaryResponse: [{type: mongoose.Schema.Types.Mixed}], // Manter como Mixed se não houver estrutura definida
            summary: {type: genericSummarySchema, default: null},
        });

        const checkSchema = new mongoose.Schema({
            // checkResponse: [checkResponseSchema],
            // summary: {type: summarySchema, default: null},
            checkResponse: [{type: mongoose.Schema.Types.Mixed}], // Manter como Mixed se não houver estrutura definida
            summary: {type: genericSummarySchema, default: null},
        });

        const collectionRecordsSchema = new mongoose.Schema({
            // collectionRecordsResponse: [collectionRecordsResponseSchema],
            // summary: {type: summarySchema, default: null},
            collectionRecordsResponse: [{type: mongoose.Schema.Types.Mixed}], // Manter como Mixed se não houver estrutura definida
            summary: {type: genericSummarySchema, default: null},
        });

        const negativeDataSchema = new mongoose.Schema({
            pefin: {type: pefinSchema, default: null},
            refin: {type: refinSchema, default: null},
            notary: {type: notarySchema, default: null},
            check: {type: checkSchema, default: null},
            collectionRecords: {type: collectionRecordsSchema, default: null},
        });

        ////////////

        const scoreSchema = new mongoose.Schema({
            score: {type: Number, default: null},
            scoreModel: {type: String, default: null},
            range: {type: String, default: null},
            defaultRate: {type: String, default: null},
            codeMessage: {type: Number, default: null},
            message: {type: String, default: null},
        });

        ////////////

        const inquiryResponseSchema = new mongoose.Schema({
            occurrenceDate: {type: String, default: null},
            segmentDescription: {type: String, default: null},
            daysQuantity: {type: Number, default: null},
        });

        const inquiryQuantitySchema = new mongoose.Schema({
            inquiryDate: {type: String, default: null},
            occurrences: {type: Number, default: 0},
            bankOccurrences: {type: Number, default: 0},
            companyOccurrences: {type: Number, default: 0},
        });

        const checkInquiriesQuantitySchema = new mongoose.Schema({
            inquiryDate: {type: String, default: null},
            occurrences: {type: Number, default: 0},
        });

        const inquiryQuantityWrapperSchema = new mongoose.Schema({
            actual: {type: Number, default: 0},
            checkActual: {type: Number, default: 0},
            creditInquiriesQuantity: [inquiryQuantitySchema],
            checkInquiriesQuantity: [checkInquiriesQuantitySchema],
        });

        ////////////
        const inquirySummaryNestedSchema = new mongoose.Schema({
            count: {type: Number, default: 0},
            checkCount: {type: Number, default: 0},
            creditCount: {type: Number, default: 0},
        });
        /////////

        const inquirySchema = new mongoose.Schema({
            inquiryResponse: [inquiryResponseSchema],
            summary: {
                count: {type: Number, default: 0},
            },
        });

        const inquirySummarySchema = new mongoose.Schema({
            // inquiryQuantity: {type: inquiryQuantityWrapperSchema, default: null},
            // summary: {
            //     count: {type: Number, default: 0},
            //     checkCount: {type: Number, default: 0},
            //     creditCount: {type: Number, default: 0},
            // },
            inquiryQuantity: {type: inquiryQuantityWrapperSchema, default: null},
            summary: {type: inquirySummaryNestedSchema, default: null},
        });

        const stolenDocumentsSchema = new mongoose.Schema({
            // stolenDocumentsResponse: [{type: Schema.Types.Mixed}],
            // summary: {type: summarySchema, default: null},
            stolenDocumentsResponse: [{type: mongoose.Schema.Types.Mixed}],
            summary: {type: genericSummarySchema, default: null},
        });

        const judgementFilingsSchema = new mongoose.Schema({
            // judgementFilingsResponse: [{type: Schema.Types.Mixed}],
            // summary: {type: summarySchema, default: null},
            judgementFilingsResponse: [{type: mongoose.Schema.Types.Mixed}],
            summary: {type: genericSummarySchema, default: null},
        });

        const bankruptsSchema = new mongoose.Schema({
            // bankruptsResponse: [{type: Schema.Types.Mixed}],
            // summary: {type: summarySchema, default: null},
            bankruptsResponse: [{type: mongoose.Schema.Types.Mixed}],
            summary: {type: genericSummarySchema, default: null},
        });

        const factsSchema = new mongoose.Schema({
            inquiry: {type: inquirySchema, default: null},
            inquirySummary: {type: inquirySummarySchema, default: null},
            stolenDocuments: {type: stolenDocumentsSchema, default: null},
            judgementFilings: {type: judgementFilingsSchema, default: null},
            bankrupts: {type: bankruptsSchema, default: null},
        });

        const partnershipResponseSchema = new mongoose.Schema({
            businessDocument: {type: String, default: null},
            companyName: {type: String, default: null},
            participationPercentage: {type: Number, default: null},
            companyStatus: {type: String, default: null},
            companyStatusCode: {type: String, default: null},
            companyState: {type: String, default: null},
            companyStatusDate: {type: String, default: null},
            updateDate: {type: String, default: null},
            participationInitialDate: {type: String, default: null},
            hasNegative: {type: Boolean, default: false},
        });

        const partnerSchema = new mongoose.Schema({
            partnershipResponse: [partnershipResponseSchema],
            summary: {type: summarySchema, default: null},
        });

        //////////

        const attributesResponseSchema = new mongoose.Schema({
            scoring: {type: Number, default: null},
            attributeModel: {type: String, default: null},
            codeMessage: {type: Number, default: null},
            message: {type: String, default: null},
        });

        const attributesSchema = new mongoose.Schema({
            attributesResponse: [attributesResponseSchema],
        });

        ///////

        this.schema = new mongoose.Schema(
            {
                documento: {type: String, required: true, unique: true},
                reportName: {type: String, default: null},
                registration: {type: registrationSchema, default: null},
                negativeData: {type: negativeDataSchema, default: null},
                negativeSummary: {type: Schema.Types.Mixed, default: {}},
                ////
                score: {type: scoreSchema, default: null}, // Adicionado
                ////
                facts: {type: factsSchema, default: null},
                partner: {type: partnerSchema, default: null},
                ////
                attributes: {type: attributesSchema, default: null}, // Adicionado
                ////
            },
            {
                timestamps: true,
                autoIndex: true,
            }
        );

        const modelNome = "onda_serasa_consulta_pf";
        this.model = mongoose.model(modelNome, this.schema, modelNome);
        this.model.syncIndexes();
    }

    async post({data, documento}) {
        try {
            await this.model.updateOne({documento: documento}, {$set: data}, {upsert: true});
        } catch (err) {
            await onda_errors.postNotRes({
                classe: "onda_serasa_consulta_pf",
                statico: "post",
                message: JSON.stringify(err)?.slice(0, 4900),
            });
        }
    }

    async getOne({documento}) {
        try {
            const result = await this.model.findOne({documento: documento});
            return result;
        } catch (err) {
            await onda_errors.postNotRes({
                classe: "onda_serasa_consulta",
                statico: "getOne",
                message: JSON.stringify(err)?.slice(0, 4900),
            });

            return setResponse.DATABASE_ERROR({message: "Erro ao buscar o registro."});
        }
    }

    async getAll() {
        try {
            const results = await this.model.find();
            return results;
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar os registros."});
        }
    }
}

export default new onda_serasa_consulta_pf();
