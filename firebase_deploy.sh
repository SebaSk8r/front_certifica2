rm -rf /home/seba/desarrollo/slared/metropol-certifica/dist_ant/ || true
rm -rf /home/seba/desarrollo/slared/redbus-certifica/dist_ant/ || true
rm -rf /home/seba/desarrollo/slared/subus-certifica/dist_ant/ || true
rm -rf /home/seba/desarrollo/slared/voy-certifica/dist_ant/ || true

mv /home/seba/desarrollo/slared/metropol-certifica/dist /home/seba/desarrollo/slared/metropol-certifica/dist_ant
mv /home/seba/desarrollo/slared/redbus-certifica/dist /home/seba/desarrollo/slared/redbus-certifica/dist_ant
mv /home/seba/desarrollo/slared/subus-certifica/dist /home/seba/desarrollo/slared/subus-certifica/dist_ant
mv /home/seba/desarrollo/slared/voy-certifica/dist /home/seba/desarrollo/slared/voy-certifica/dist_ant

mkdir /home/seba/desarrollo/slared/metropol-certifica/dist
mkdir /home/seba/desarrollo/slared/redbus-certifica/dist
mkdir /home/seba/desarrollo/slared/subus-certifica/dist
mkdir /home/seba/desarrollo/slared/voy-certifica/dist

cp -a dist_metropol/. /home/seba/desarrollo/slared/metropol-certifica/dist/
cp -a dist_redbus/. /home/seba/desarrollo/slared/redbus-certifica/dist/
cp -a dist_subus/. /home/seba/desarrollo/slared/subus-certifica/dist/
cp -a dist_voy/. /home/seba/desarrollo/slared/voy-certifica/dist/

cd  /home/seba/desarrollo/slared/metropol-certifica/ && firebase deploy
cd  /home/seba/desarrollo/slared/redbus-certifica/ && firebase deploy
cd  /home/seba/desarrollo/slared/subus-certifica/ && firebase deploy
cd  /home/seba/desarrollo/slared/voy-certifica/ && firebase deploy
