// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  ajax_dir: '/includes/modules/ajax/ng',
  file_dir: '/cache/file/ng-chat',
  use_bots: false,
  use_thread_input: true,
  split_ui: true,
  max_messages: 4,
  chat_window_height: 396,
  show_loader: true,
  default_message_text: 'New user joined the session',
  message_input_height: 50,
  max_files_per_session: 5,
  max_file_size: 1000000
};
