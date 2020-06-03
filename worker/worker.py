import json
import os
from random import randint
from time import sleep

import redis

print('starting worker...')

# if __name__ == '__main__':
redis_host = os.getenv('REDIS_HOST', 'auth_queue')
r = redis.Redis(host=redis_host, port=6379, db=0)
print('connected to redis!')
while True:
    print('looking for messages..')
    sleep(3)
    try:
        print(r.blpop('register_message_queue'))
        # mensagem = json.loads(r.blpop('register_message_queue')[1])
        # # Simulando envio de email...
        # print("#################### Enviando mensagem")
        # sleep(randint(5, 10))
        # print('#################### Mensagem enviada com sucesso: ' + mensagem)
    except Exception as e:
        print('Erro!!!!')