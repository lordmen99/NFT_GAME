import React, { useEffect, useState } from "react";
import { Flex, Text, SimpleGrid, useColorModeValue } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import axios from "axios";
import InventoryCard from "./InventoryCard";
import Collections from "./Collections";
import { Separator } from "../../Separator/Separator";
import ItemList from "./ItemList";

const Inventory = ({ as, slideIn }) => {
  const blockchain = useSelector((state) => state.blockchain);
  const { account, auth } = blockchain;
  const { NEXT_PUBLIC_SERVER_URL } = process.env;

  // 게임 아이템 목록
  const [gameItems, setGameItems] = useState([]);

  // 아이템 목록 가져오기
  const getGameItems = async () =>
    await axios
      .get(`${NEXT_PUBLIC_SERVER_URL}/items/game-items`)
      .then((res) => {
        setGameItems(res.data);
      });

  useEffect(async () => {
    if (!(account && auth)) return false;
    await getGameItems();
  }, [account, auth]); //account

  useEffect(async () => {
    if (!(account && auth)) return false;
    await getGameItems();
  }, [account, auth]); //account

  const txtColor = useColorModeValue("gray.600", "gray.300");

  return (
    <>
      <SimpleGrid as={as} animation={slideIn}>
        <Text
          fontSize={"1.5rem"}
          fontWeight="bold"
          color={txtColor}
          textAlign="center"
          m={5}
        >
          Items
        </Text>
        <Separator />

        <ItemList gameItems={gameItems} />

        <Text
          fontSize={"1.5rem"}
          fontWeight="bold"
          textAlign="center"
          color={txtColor}
          m={5}
        >
          Nfts
        </Text>
        <Separator />
        <Collections />
      </SimpleGrid>
    </>
  );
};

export default Inventory;
