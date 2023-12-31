import useBoardContext from "@/containers/Board/hooks/useBoardContext";
import { ICard, IColumn, Type } from "@/types/Data.type";
import { arrayMove, insertItemAt } from "@/utils/repo";
import { DragEndEvent, DragOverEvent, DragStartEvent, UniqueIdentifier } from "@dnd-kit/core";
import { useState } from "react";

//interface EvenDragProps {}

function EvenDrag() {
  const { listColumn, setListColumn, listCard, setListCard } = useBoardContext();
  const [activeData, setActiveData] = useState<IColumn | ICard | null>(null);

  const [activeDragType, setActiveDragType] = useState<Type.CARD | Type.COLUMN | null>(null);

  /**
   * Callback function triggered when a drag operation starts.
   *
   * @param {DragStartEvent} active - The drag event object containing information about the active drag.
   */

  const onDragStart = ({ active }: DragStartEvent) => {
    // Check if the drag operation involves a column
    if (active.data.current && active.data.current?.type === Type.COLUMN) {
      // Set the active data and drag type for a column drag
      setActiveData(active.data.current?.dataDrag);
      setActiveDragType(Type.COLUMN);
    } else if (active.data.current && active.data.current?.type === Type.CARD) {
      // Set the active data for a card drag
      setActiveData(active.data.current?.dataDrag);
      setActiveDragType(Type.CARD);
    }
  };

  /**
   *  Trigger During Dragging Item
   * @param event
   */
  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    /**  Break If Card Don't Change Position Or Item Over Null */

    if (!active || !over || active.id === over.id) return;
    const isActiveCardType = active.data.current?.type === Type.CARD;
    if (!isActiveCardType) return;
    /** */

    const activeId = active.id;
    const overId = over.id;
    const dataActive: ICard = active.data.current?.dataDrag;
    const dataOver: ICard = over.data.current?.dataDrag;
    /** Dropping a Task over another Task or Dropping difference COLUMN WHEN EMPTY */

    if (active.data.current?.type !== over.data.current?.type) {
      return handleCardOverColumnEmpty(activeId, overId, dataActive);
    }
    /** Dropping a Task over another Task or Dropping difference COLUMN  */

    if (dataActive.columnId !== dataOver.columnId) {
      const isBelowOverItem =
        over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
      return handleMoveCardOverColumn(activeId, overId, dataActive, dataOver, isBelowOverItem);
    }
  };

  /**
   * Trigger When Done An Action Drag Item , This Mean Drop
   * @param event
   * @returns
   */
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveData(null);
    setActiveDragType(null);
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;
    const activeType = active.data.current?.type;
    const columnId = active.data.current?.dataDrag.columnId;
    if (!activeType) return;

    if (activeType === Type.COLUMN) {
      handleMoveArrayDragEndColumn(activeId, overId);
    } else if (activeType === Type.CARD) {
      handleMoveArrayDragEndCard(columnId, activeId, overId);
    }
    /** */
  };

  /**
   *
   * @param activeId
   * @param overId
   */
  const handleMoveArrayDragEndColumn = (activeId: UniqueIdentifier, overId: UniqueIdentifier) => {
    const activeColumnIndex = listColumn.findIndex((column) => column._id === activeId);
    const overColumnIndex = listColumn.findIndex((column) => column._id === overId);
    setListColumn((columns) => arrayMove(columns, activeColumnIndex, overColumnIndex));
  };

  /**
   *
   * @param activeId
   * @param overId
   * @param dataActiveCard
   * @param dataOverCard
   *
   *
   */

  const handleMoveCardOverColumn = (
    activeId: UniqueIdentifier,
    overId: UniqueIdentifier,
    dataActive: ICard,
    dataOver: ICard,
    isBelowOverItem: boolean | null
  ) => {
    const listCardActive = listCard[dataActive.columnId];
    const listCardOver = listCard[dataOver.columnId];

    if (!listCardActive || !listCardOver) return;

    const overIndexCard = listCardOver.findIndex((card) => card._id === overId);

    const newIndex = overIndexCard >= 0 ? overIndexCard + (isBelowOverItem ? 1 : 0) : listCardOver.length + 1;

    const newListCardActive = listCardActive.filter((card) => card._id !== activeId);

    setListCard((prevCards) => ({
      ...prevCards,
      [dataActive.columnId]: newListCardActive,
      [dataOver.columnId]: insertItemAt(listCardOver, { ...dataActive, columnId: dataOver.columnId }, newIndex),
    }));
  };

  /**
   *
   * @param activeId
   * @param overId
   *
   */

  const handleMoveArrayDragEndCard = (
    columnId: UniqueIdentifier,
    activeId: UniqueIdentifier,
    overId: UniqueIdentifier
  ) => {
    let activeCardIndex: number = -1;
    let overCardIndex: number = -1;

    const list = listCard[columnId];

    if (!list) return;

    list.forEach((card, index) => {
      if (card._id === activeId) activeCardIndex = index;
      if (card._id === overId) overCardIndex = index;
    });

    if (activeCardIndex !== -1 && overCardIndex !== -1) {
      listCard[columnId] = arrayMove(list, activeCardIndex, overCardIndex);
      setListCard(listCard);
    }
  };

  /**
   *
   * @param activeCardId
   * @param overColumnId
   * @param dataCard
   */
  const handleCardOverColumnEmpty = (
    activeCardId: UniqueIdentifier,
    overColumnId: UniqueIdentifier,
    dataCard: ICard
  ) => {
    setListCard((prevCards) => ({
      ...prevCards,
      [dataCard.columnId]: prevCards[dataCard.columnId]?.filter((card) => card._id !== activeCardId),
      [overColumnId]: [...prevCards[overColumnId], { ...dataCard, columnId: overColumnId }],
    }));
  };

  return {
    onDragStart,
    onDragOver,
    onDragEnd,
    activeData,
    activeDragType,
  };
}

export default EvenDrag;
