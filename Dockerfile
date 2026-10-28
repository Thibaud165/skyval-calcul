# Skyval Calcul : Ollama + petit serveur Node (interface web et lien avec Atlas) dans un seul conteneur
FROM node:22-slim AS node
# Ollama récent : le registre d'Ollama refuse les modèles actuels aux versions trop anciennes (erreur 412)
FROM ollama/ollama:0.40.12
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY app /app
ENV DATA=/data
VOLUME /data
EXPOSE 8642
ENTRYPOINT ["node", "/app/serveur.mjs"]
