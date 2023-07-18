import { model, Schema, type Document } from "mongoose"

export interface IScore {
  score: number
  test: string
}

export interface IScoreDocument extends IScore, Document {}

const scoreSchema = new Schema<IScore>({
  score: { type: Number, required: true },
  test: { type: String, required: true }
})

const ScoreModel = model<IScoreDocument>("Score", scoreSchema)

export default ScoreModel
