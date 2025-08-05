del data\* /s /q
pnpm drizzle-kit push
pnpm tsx src\db\seed.ts
echo "Data refreshed!"