# Staging image: static build served by nginx, routed by nginx-proxy on the VPS.
FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/
