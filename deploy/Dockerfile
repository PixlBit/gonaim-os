# صورة إحنا — خادم واحد يقدّم الواجهة والـAPI.
#
# tsx يبقى في الصورة عمدًا: الخادم يعمل من TypeScript مباشرة كما في
# التطوير، فما يُختبر محليًا هو نفسه ما يعمل على الخادم — لا خطوة ترجمة
# إضافية تصنع فرقًا لا يظهر إلا في الإنتاج.
FROM node:22-alpine

WORKDIR /app

# طبقة التبعيات أولًا: لا تُعاد إلا لو تغيّر القفل
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps ./apps
COPY scripts ./scripts
COPY tsconfig.json tsconfig.base.json ./
COPY supabase ./supabase

RUN npm ci --no-audit --no-fund && npm run ehna:build && npm cache clean --force

# البيانات خارج الصورة دائمًا — الصورة تُستبدل والمساحة تبقى
ENV EHNA_PORT=8788 \
    EHNA_DIR=/data \
    EHNA_STATIC=apps/ehna/dist \
    NODE_ENV=production
VOLUME /data
EXPOSE 8788

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8788/api/health || exit 1

CMD ["npm", "run", "ehna"]
