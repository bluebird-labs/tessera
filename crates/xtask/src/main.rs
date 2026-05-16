use std::env;
use std::ffi::OsString;
use std::process::{Command, ExitCode, Stdio};

#[derive(Debug)]
struct TaskStatus {
    code: ExitCode,
    success: bool,
}

fn main() -> ExitCode {
    match run() {
        Ok(status) => status.code,
        Err(err) => {
            eprintln!("xtask: {err}");
            ExitCode::FAILURE
        }
    }
}

fn run() -> Result<TaskStatus, String> {
    let mut args = env::args_os().skip(1);
    let task = args
        .next()
        .ok_or_else(|| "usage: cargo xtask <cli|desktop|desktop-build|check> [args]".to_owned())?;

    match task.to_string_lossy().as_ref() {
        "cli" => cargo_run_cli(strip_separator(args.collect())),
        "desktop" => pnpm(["tauri", "dev"]),
        "desktop-build" => {
            let frontend = pnpm(["build"])?;
            if !frontend.success {
                return Ok(frontend);
            }
            cargo(["build", "-p", "tessera-desktop"])
        }
        "check" => check(),
        other => Err(format!("unknown task `{other}`")),
    }
}

fn check() -> Result<TaskStatus, String> {
    for status in [
        cargo(["fmt", "--all", "--check"])?,
        cargo(["clippy", "--workspace", "--all-targets"])?,
        cargo(["test", "-p", "tessera-cli"])?,
        pnpm(["build"])?,
        cargo(["build", "-p", "tessera-desktop"])?,
    ] {
        if !status.success {
            return Ok(status);
        }
    }

    Ok(TaskStatus::success())
}

fn cargo_run_cli(args: Vec<OsString>) -> Result<TaskStatus, String> {
    let mut command = Command::new("cargo");
    command.args(["run", "-p", "tessera-cli", "--"]).args(args);
    run_command(&mut command)
}

fn cargo<const N: usize>(args: [&str; N]) -> Result<TaskStatus, String> {
    let mut command = Command::new("cargo");
    command.args(args);
    run_command(&mut command)
}

fn pnpm<const N: usize>(args: [&str; N]) -> Result<TaskStatus, String> {
    let mut command = Command::new("corepack");
    command.args(["pnpm", "--dir", "crates/desktop"]).args(args);
    command.env("CI", "true");
    run_command(&mut command)
}

fn run_command(command: &mut Command) -> Result<TaskStatus, String> {
    let status = command
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .map_err(|err| format!("failed to spawn {command:?}: {err}"))?;

    let code = status.code().map_or(ExitCode::FAILURE, |code| {
        u8::try_from(code).map_or(ExitCode::FAILURE, ExitCode::from)
    });

    Ok(TaskStatus {
        code,
        success: status.success(),
    })
}

fn strip_separator(mut args: Vec<OsString>) -> Vec<OsString> {
    if args.first().is_some_and(|arg| arg == "--") {
        args.remove(0);
    }
    args
}

impl TaskStatus {
    const fn success() -> Self {
        Self {
            code: ExitCode::SUCCESS,
            success: true,
        }
    }
}
