# Skyval Calcul : Ollama + petit serveur Node (interface web et lien avec Atlas) dans un seul conteneur
FROM node:22-slim AS node
FROM ollama/ollama:0.24.0
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY app /app
ENV DATA=/data
VOLUME /data
EXPOSE 8642
ENTRYPOINT ["node", "/app/serveur.mjs"]
