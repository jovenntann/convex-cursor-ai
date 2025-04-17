import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

import { z } from "zod";
import OpenAI from "openai";

const http = httpRouter();

http.route({
  path: "/telegram-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    /* Telegram bot token */
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    /* Try to process the message */
    try {
      const messageData = await request.json();
      console.log("Message Data:", messageData);
      const { update_id, message } = messageData;

      if (!message) {
        console.log("No message found in the request.");
        return new Response("No message to process", {
          status: 200,
        });
      }

      const { from, chat, date, text, photo, entities } = message;
      
      const message_id = message.message_id || null;
      console.log("Received Telegram message:", {
        update_id,
        message_id,
        from,
        chat,
        date,
        text,
        photo,
        entities,
      });
    
      /* Get userId based on telegramUserId */
      const telegramUserId = from.id.toString();
      console.log("Telegram User ID:", telegramUserId);

      /* Check if the message is a /start command */
      if (text && text.startsWith('/start')) {
        const userId = text.split(' ')[1];
        console.log("Extracted User ID from /start command:", userId);

        /* Link the telegram user ID to the user account */
        await ctx.runMutation(internal.users.linkTelegramUser, {
          telegramUserId,
          userId,
        });
        console.log("Telegram ID linked to user:", userId);

        /* Send a message back to the user */
        const sendMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const responseMessage = {
          chat_id: chat.id,
          text: "Your telegram successfully connected! You can now start uploading your receipts.",
        };

        const sendMessageResponse = await fetch(sendMessageUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(responseMessage),
        });

        if (!sendMessageResponse.ok) {
          console.error("Failed to send message:", await sendMessageResponse.text());
        } else {
          console.log("Message sent successfully");
        }

        return new Response(null, {
          status: 200,
        });
      }

      const user = await ctx.runMutation(internal.users.getUserByTelegramId, { telegramUserId });
      console.log("User:", user);
      const userId = user?.userId;
      console.log("User ID:", userId);

      if (!userId) {
        // Send an error message if the user is not authenticated
        const sendMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const responseMessage = {
          chat_id: chat.id,
          text: "You need to connect your account first. Please click the deep link from the app.",
        };

        await fetch(sendMessageUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(responseMessage),
        });
        
        throw new Error("User not authenticated");
      }

      /* 
      ================================================
        If the message is text 
      ================================================
      */
      if (text) {
        const categories = await ctx.runMutation(internal.categories.getCategoriesMutation, { userId });
        /* Use OpenAI to analyze the text */
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        
        // Define the schema for the expected response
        const ReceiptData = z.object({
          date: z.string().optional(),
          type: z.string().optional(),
          title: z.string().optional(), // Using title instead of description for text messages
          category: z.string().optional(),
          amount: z.number().optional(),
          status: z.string().optional(),
          metadata: z.string().optional(),
        });
        
        const promptText = `
          Extract Transaction Details from this text and respond with JSON. 
          Date should be in YYYY-MM-DD format (return none if not provided). 
          Current date is ${new Date().toISOString().split('T')[0]}. Use this if the date is not provided. 
          Title should be in Sentence case. (Item name) 
          Type field should be either income or expense. 
          Use the following categories for classification (use general knowledge). 
          You should only chose from the categories provided below.
          
          Return your answer as a JSON object with these fields:
          {
            "date": "YYYY-MM-DD",
            "type": "income or expense",
            "title": "Item title",
            "category": "Category name from list",
            "amount": 123.45
          }
          
          Categories: ${JSON.stringify(categories)}
          
          Text to analyze: ${text}
        `;
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: promptText,
            },
          ],
          response_format: { type: "json_object" },
        });
        
        let responseContent;
        try {
          responseContent = response.choices[0].message.content
            ? JSON.parse(response.choices[0].message.content)
            : null;
        } catch (e) {
          console.error("Failed to parse OpenAI response as JSON:", e);
          console.log("Raw content:", response.choices[0].message.content);
          
          // Send error message to user
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chat_id: chat.id,
              text: "Sorry, I could not process your message. Please try again with a clearer text.",
            }),
          });
          
          return new Response(null, { status: 200 });
        }

        if (responseContent) {
          const date = (responseContent.date && !isNaN(Date.parse(responseContent.date))) 
            ? responseContent.date 
            : new Date().toISOString().split('T')[0];
          
          // Find the category ID based on the category name
          const category = categories.find((c: any) => c.name.toLowerCase() === responseContent.category.toLowerCase());
          const categoryId = category?._id;
          
          if (!categoryId) {
            // If category not found, inform the user
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                chat_id: chat.id,
                text: `Category "${responseContent.category}" not found. Please use one of these categories: ${categories.map((c: any) => c.name).join(", ")}`,
              }),
            });
            return new Response(null, { status: 200 });
          }
          
          /* Insert the receipt entry into the database */
          try {
            const receipt = await ctx.runMutation(internal.receipts.insertReceipt, {
              userId: userId,
              date: date,
              type: responseContent.type,
              description: responseContent.title || "No description provided", // Map title to description
              categoryId: categoryId,
              amount: responseContent.amount,
              status: "PENDING",
            });
            
            if (receipt) {
              console.log("Receipt entry created with ID:", receipt);
            }
          } catch (error) {
            console.error("Failed to insert receipt:", error);
            
            // Send error message to user
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                chat_id: chat.id,
                text: "Sorry, I encountered an error saving your receipt. Please try again later.",
              }),
            });
            
            return new Response(null, { status: 200 });
          }
          
          /* Send a reply to the user about the extracted data */
          const replyText = `Extracted Data:\nDate: ${date}\nType: ${responseContent.type}\nTitle: ${responseContent.title}\nCategory: ${responseContent.category}\nAmount: ${responseContent.amount}`;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chat_id: chat.id,
              text: replyText,
            }),
          });
        }
      /* 
      ================================================
        If the message is an image 
      ================================================
      */
      } else if (photo && photo.length > 0) {
        /* Get the highest quality photo from the array of photos */
        const highestQualityPhoto = photo[photo.length - 1];
        const fileId = highestQualityPhoto.file_id;
        /* Get the file path for the photo using Telegram's getFile API */
        const fileResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
        );
        const fileData = await fileResponse.json();

        if (fileData.ok) {
          /* Construct the full URL to download the photo */
          const filePath = fileData.result.file_path;
          const photoUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
          
          // Download the image
          const imageResponse = await fetch(photoUrl);
          const imageBlob = await imageResponse.blob();
          
          // Upload to Convex storage
          const receiptId = await ctx.storage.store(imageBlob);
          const storageUrl = await ctx.storage.getUrl(receiptId);
          
          if (!storageUrl) {
            throw new Error("Failed to get storage URL for receipt image");
          }
          
          /* Fetch categories to pass in the prompt */
          const categories = await ctx.runMutation(internal.categories.getCategoriesMutation, { userId });
          
          /* Use OpenAI Vision API to analyze the image and extract transaction details */
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });
          
          // Define the schema for the expected response
          const ReceiptData = z.object({
            date: z.string().optional(),
            type: z.string().optional(),
            title: z.string().optional(), // Using title for image analysis
            category: z.string().optional(),
            amount: z.number().optional(),
            status: z.string().optional(),
            metadata: z.string().optional(),
          });
          
          const prompt = `
            Extract Transaction Details from this receipt image and return as JSON.
            Date should be in YYYY-MM-DD format (return none if not provided).
            Current date is ${new Date().toISOString().split('T')[0]}. Use this if the date is not provided.
            Title should be in Sentence case. (Item name)
            Type field should be either income or expense.
            Use the following categories for classification (use general knowledge).
            You should only chose from the categories provided below.
            Return ONLY a JSON object with the following structure:
            {
              "date": "YYYY-MM-DD",
              "type": "income or expense",
              "title": "Item description",
              "category": "Category name from list",
              "amount": 123.45
            }
            
            Categories: ${JSON.stringify(categories)}
          `;
          
          try {
            const response = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: storageUrl } }
                  ],
                },
              ],
              response_format: { type: "json_object" },
            });
            
            /* Log the OpenAI response for debugging */
            console.log("OpenAI Vision API Response:", response);
            
            let responseContent;
            try {
              responseContent = response.choices[0].message.content
                ? JSON.parse(response.choices[0].message.content)
                : null;
            } catch (e) {
              console.error("Failed to parse OpenAI response as JSON:", e);
              console.log("Raw content:", response.choices[0].message.content);
              
              // Send error message to user
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  chat_id: chat.id,
                  text: "Sorry, I couldn't properly analyze your receipt. Please try again with a clearer image.",
                }),
              });
              
              return new Response(null, { status: 200 });
            }

            if (responseContent) {
              const date = (responseContent.date && !isNaN(Date.parse(responseContent.date))) 
                ? responseContent.date 
                : new Date().toISOString().split('T')[0];
              
              // Find the category ID based on the category name
              const category = categories.find((c: any) => c.name.toLowerCase() === responseContent.category.toLowerCase());
              const categoryId = category?._id;
              
              if (!categoryId) {
                // If category not found, inform the user
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    chat_id: chat.id,
                    text: `Category "${responseContent.category}" not found. Please use one of these categories: ${categories.map((c: any) => c.name).join(", ")}`,
                  }),
                });
                return new Response(null, { status: 200 });
              }
              
              /* Store the extracted information in the database */
              try {
                const receipt = await ctx.runMutation(internal.receipts.insertReceipt, {
                  userId: userId,
                  date: date,
                  type: responseContent.type,
                  description: responseContent.title || "No description provided", // Map title to description
                  categoryId: categoryId,
                  amount: responseContent.amount,
                  status: "PENDING",
                  receiptId: receiptId,
                });

                if (receipt) {
                  console.log("Receipt entry created with ID:", receipt);
                }
              } catch (error) {
                console.error("Failed to insert receipt:", error);
                
                // Send error message to user
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    chat_id: chat.id,
                    text: "Sorry, I encountered an error saving your receipt. Please try again later.",
                  }),
                });
                
                return new Response(null, { status: 200 });
              }

              /* Format and send a response back to the user via Telegram */
              const replyText = `Extracted Data:\nDate: ${date}\nType: ${responseContent.type}\nTitle: ${responseContent.title}\nCategory: ${responseContent.category}\nAmount: ${responseContent.amount}`;
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  chat_id: chat.id,
                  text: replyText,
                }),
              });
            }
          } catch (error) {
            console.error("OpenAI Vision API error:", error);
            
            // Send error message to user
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                chat_id: chat.id,
                text: "Sorry, I encountered an error analyzing your receipt. Please try again later.",
              }),
            });
          }
        }
      }
      return new Response(null, {
        status: 200,
      });
    } catch (error) {
      console.error("Error processing Telegram message:", error);
      return new Response("Message unable to be processed", {
        status: 200,
      });
    }
  }),
});

export default http; 