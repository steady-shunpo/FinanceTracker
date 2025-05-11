from llama_index.llms.ollama import Ollama 
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, ServiceContext
from llama_index.core.embeddings import resolve_embed_model

from llama_index.core.llms import ChatMessage

llm = Ollama(model="gemma3:1b", request_timeout=30.0)

import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\\Users\\Tanmay\\AppData\\Local\\Tesseract-OCR\\tesseract.exe'
from PIL import Image

# Load the image (payment screenshot)
image = Image.open('./data/screenshot.jpg')

# Run OCR to extract the text
ocr_text = pytesseract.image_to_string(image)

with open("./textdata/payment_text.txt", "w") as file:
    file.write(ocr_text)

reader = SimpleDirectoryReader('./textdata').load_data()  # Directory containing your text files
embed_model = resolve_embed_model("local:BAAI/bge-m3")
index = VectorStoreIndex.from_documents(reader, embed_model=embed_model)
query_engine = index.as_query_engine(llm = llm)


prompt  = f"""
You are a payment AI assistant. given a text, extract the payment details like amount, transaction remarks and date.
the text is {ocr_text}
the remark is usually what the transaction was made for, like milk, groceries, etc and is one word long.
"""



messages = [
    ChatMessage(
        role = "system", content = prompt),
    ChatMessage(
        role = "user", content = "what is the transaction amount and remark?",
    )
]


result = llm.chat(messages)
print(result)


# result = llm.complete("hello world")
# print(result)
