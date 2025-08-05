del data\config.json /s /q
del data\db.sqlite /s /q
pnpm db:push
pnpm tsx data\seed.ts
echo "Data refreshed!"