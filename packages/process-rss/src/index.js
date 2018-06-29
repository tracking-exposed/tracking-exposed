// @flow
import dotenv from "dotenv";
import type {StreamEvent} from "@tracking-exposed/data/src/redis";

dotenv.config();

const processor = async (event: StreamEvent, cfg: {}): Promise<void> => {
  console.log(event, cfg);
};

export default processor;