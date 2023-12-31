import { model, Schema, type Types, type Document } from "mongoose"

export interface IScore {
  score: number | null
  test: string
  total: number
  provisionalAverage: number
}

export interface IScoreCard {
  student: Types.ObjectId
  subject: Types.ObjectId
  attendancePercentage: string
  scores: IScore[]
}

export interface IScoreCardDocument extends IScoreCard, Document {}

const scoreCardSchema = new Schema<IScoreCard>({
  student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  attendancePercentage: { type: String, required: true },
  scores: {
    type: [
      {
        score: { type: Number, required: true },
        test: { type: String, required: true },
        total: { type: Number, required: true },
        provisionalAverage: { type: Number, required: true }
      }
    ],
    default: []
  }
})

const ScoreCardModel = model<IScoreCardDocument>("ScoreCard", scoreCardSchema)

export default ScoreCardModel
