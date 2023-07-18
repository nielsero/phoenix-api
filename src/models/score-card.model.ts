import { model, Schema, type Types, type Document } from "mongoose"

export interface IScoreCard {
  student: Types.ObjectId
  subject: Types.ObjectId
  scores: Types.ObjectId[]
}

export interface IScoreCardDocument extends IScoreCard, Document {}

const scoreCardSchema = new Schema<IScoreCard>({
  student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  scores: {
    type: [{ type: Schema.Types.ObjectId, ref: "Score" }],
    default: []
  }
})

const ScoreCardModel = model<IScoreCardDocument>("ScoreCard", scoreCardSchema)

export default ScoreCardModel
