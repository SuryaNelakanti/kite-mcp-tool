import { Router } from 'express';
import { z } from 'zod';
import { HumanMessage, SystemMessage } from "langchain/schema";
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import mcpClient from '../mcp-client.js';
import validate from '../middlewares/validate.js';
import HttpError from '../utils/http-error.js';
import env from '../env.js';

const router = Router();

const UserReq = z.object({
  message: z.string().min(1),
});

router.post('/', validate(UserReq), async (req, res, next) => {
  if (!env.OPENAI_API_KEY) {
    return next(new HttpError(400, 'llm_unavailable'));
  }
  try {
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({ method: z.string(), params: z.record(z.any()) })
    );
    const prompt = `You are an assistant that converts English commands into JSON-RPC calls understood by Zerodha MCP. Return ONLY a valid JSON object with {method:string, params:object}.`;
    const llm = new ChatOpenAI({ openAIApiKey: env.OPENAI_API_KEY });
    const resp = await llm.call([
      new SystemMessage(prompt),
      new HumanMessage(req.body.message),
    ]);
    const json = await parser.parse(resp.text);
    const result = await mcpClient.call(json.method, json.params);
    res.json(result);
  } catch (err) {
    next(new HttpError(400, 'invalid_request'));
  }
});

export default router;
