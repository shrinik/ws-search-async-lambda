const apigw = require('@aws-sdk/client-apigatewaymanagementapi')
const ollama = require('@langchain/community/chat_models/ollama')

exports.handler = async (event) => {

  // Extract data from message
  const record = event['Records'][0]
  const messageData = record.Sns.Message
  const parsedMessageData = JSON.parse(messageData)

  let callbackUrl = process.env.callbackUrl  
  const client = new apigw.ApiGatewayManagementApiClient({ endpoint: callbackUrl });

  const connectionId = parsedMessageData.connectionId;
  const sendMessage = (token) => {
    const requestParams = {
      ConnectionId: connectionId,
      Data: JSON.stringify({ data: token }),
    };
    const command = new apigw.PostToConnectionCommand(requestParams);
    
    try {
      client.send(command);
    }
    catch (error) {
      console.log(error);
    }
  }

  let llmUrl = process.env.llmUrl
  let llmModel = process.env.llmModel
  const chatModel = new ollama.ChatOllama({
    baseUrl: llmUrl,  
    model: llmModel,
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken(token) {
          sendMessage(token)
        },
      },
    ],
  });

  const message = parsedMessageData.Query;
  await chatModel.invoke(message)
  return {
    statusCode: 200,
    body: JSON.stringify({ data: "" })
  }
};
