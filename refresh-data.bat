del data\local.db /s /q
del data\config.json /s /q
pnpm drizzle-kit push
pnpm tsx src\db\seed.ts
echo "Data refreshed!"