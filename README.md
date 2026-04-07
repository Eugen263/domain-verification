# Test Service for domain verification

### Nice to do

- add esbuild or smth to build project
- investigate more accurate migration run in dockerfile when project builds
- remove dead constructors for some DTO classes
- move worker to separate independent process that will use queues or smth

### To run project
pnpm is required

```sh
pnpm install
```
installs all deps

```sh
pnpm dev
```
run project in development mode

```sh
pnpm build && pnpm start
```
builds project and run in "production" mode
must notice that in dev mode we use our local env file to load environment variables but in production mode we get it from internal docker process so vars loads on image build step