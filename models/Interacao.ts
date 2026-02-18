import mongoose, { Schema } from "mongoose";

const InteracaoSchema = new Schema({
  nome: String,
  produto: String,
  dataHora: Date,
});

export default mongoose.models.Interacao ||
  mongoose.model("Interacao", InteracaoSchema);
