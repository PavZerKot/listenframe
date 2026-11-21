{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };
  outputs = {nixpkgs, ...}: {
    devShells = nixpkgs.lib.genAttrs ["x86_64-linux"] (system: let
      pkgs = import nixpkgs {inherit system;};
    in {
      default = pkgs.mkShell {
        buildInputs = [pkgs.deno];
      };
    });
  };
}
