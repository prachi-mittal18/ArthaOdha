const { Schema } = require("mongoose");

const PositionsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  product: String,
  name: String,
  qty: Number,
  avg: Number,
  net: String,
  day: String,
  isLoss: Boolean,
  price: Number,
});
module.exports = { PositionsSchema };
