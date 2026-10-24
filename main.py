import asyncio
import shutil
import decky

class Plugin:
    async def _main(self):
        self.ddcutil = shutil.which("ddcutil") or "/usr/bin/ddcutil"
        decky.logger.info(f"Using ddcutil: {self.ddcutil}")

    async def _unload(self):
        pass

    async def _run(self, *args):
        proc = await asyncio.create_subprocess_exec(
            self.ddcutil,
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=15
            )
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            raise RuntimeError("ddcutil timed out")

        if proc.returncode != 0:
            raise RuntimeError(
                stderr.decode(errors="replace").strip()
                or f"ddcutil exited with code {proc.returncode}"
            )

        return stdout.decode(errors="replace")

    async def getBrightness(self):
        return await self._run("getvcp", "10")

    async def setBrightness(self, value: int):
        value = max(0, min(100, int(value)))
        await self._run("setvcp", "10", str(value))
        return {"success": True, "brightness": value}
