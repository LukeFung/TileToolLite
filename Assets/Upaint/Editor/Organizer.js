class Organizer extends EditorWindow
{
	static var thisWindow : EditorWindow;
	static var window : EditorWindow;
	static var images : List.<Texture2D> = new List.<Texture2D>();
	static var splits : int;
	static var rect : Rect;
	static var selectedTile : Vector2 = Vector2.zero;
	
	static function ShowWindow()
	{
		window = EditorWindow.GetWindow(UPaint);
		thisWindow = GetWindow(Organizer);
		thisWindow.position = Rect(Screen.width/2 + 100, Screen.height/2 + 100, 0, 0);
		splits = 0;
		rect = Rect(0, 0, 0, 0);
		images = new List.<Texture2D>();
		selectedTile = Vector2.zero;
		thisWindow.Show();
	}

	function OnGUI()
	{
		if(splits == 0 || images.count == 0) return;
		GUI.Label(Rect(2, 2, splits * 32 - 4, 20), "RMB To Move", "Box");
		for(var x = 0; x < splits; x++)
		{
			for(var y = 0; y < splits; y++)
			{
				var index = x * splits + y;
				rect = Rect(x * 32, 24 + ((32 * splits) - 32 - (y * 32)), 32, 32);
				GUI.DrawTexture(rect, images[index]);
				if(rect.Contains(Event.current.mousePosition))
				{
					if(Event.current.button == 0 && Event.current.type == EventType.MouseDown) selectedTile = Vector2(x, y);
					if(Event.current.button == 1 && Event.current.type == EventType.MouseDown)
					{
						images.Insert(index, images[selectedTile.x * splits + selectedTile.y]);
						var replacementImage = images[(x * splits + y) + 1];
						images.RemoveAt((x * splits + y) + 1);

						images.Insert(selectedTile.x * splits + selectedTile.y, replacementImage);
						images.RemoveAt((selectedTile.x * splits + selectedTile.y) + 1);

						selectedTile = Vector2(x, y);
					}
				}
			}
		}
		GUI.Box(Rect(selectedTile.x * 32, 24 + ((32 * splits) - 32 - (selectedTile.y * 32)), 32, 32), images[selectedTile.x * splits + selectedTile.y]);
		Repaint();
	}

	static function SetImages(i : List.<Texture2D>, s : int)
	{
		images = i;
		splits = s;
		thisWindow.maxSize = Vector2(32 * splits, 32 * splits + 24);
		thisWindow.minSize = thisWindow.maxSize;
	}
}