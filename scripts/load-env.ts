// Imported first by every script so env is ready before config/db modules load.
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
