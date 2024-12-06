{pkgs}: {
  deps = [
    pkgs.mariadb-connector-c
    pkgs.pkg-config
    pkgs.libmysqlclient
    pkgs.postgresql
  ];
}
