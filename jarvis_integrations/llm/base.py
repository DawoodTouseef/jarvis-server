from abc import ABC,abstractclassmethod
from pydantic import SecretStr

class LLMClient(ABC):
    name:str
    baseUrl:str
    apiKey:SecretStr


    @abstractclassmethod
    def chat(self):
        pass